"""
Tests for dot-to-jj-dag.py

These tests create temporary jj repositories and verify that the DOT to jj DAG
conversion works correctly.
"""

import subprocess
import tempfile
from pathlib import Path
import pytest


# Get script directory
SCRIPT_DIR = Path(__file__).parent.parent


def run_jj(cmd, cwd):
    """Run a jj command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)


@pytest.fixture
def temp_jj_repo():
    """Create a temporary jj repository and yield its path."""
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = Path(tmpdir)

        # Initialize jj repo with git backend
        code, out, err = run_jj(["jj", "git", "init"], repo_path)
        assert code == 0, f"Failed to init jj git repo: {err}"

        # Configure jj with a user
        run_jj(["jj", "config", "set", "user.name", "Test User"], repo_path)
        run_jj(["jj", "config", "set", "user.email", "test@example.com"], repo_path)

        # Create an initial file so we have something to work with
        (repo_path / "initial.txt").write_text("initial content\n")
        run_jj(["jj", "new", "-m", "initial"], repo_path)

        yield repo_path


@pytest.fixture
def dot_to_jj_script():
    """Return the path to the dot-to-jj-dag.py script."""
    return SCRIPT_DIR / "dot-to-jj-dag.py"


class TestDotToJjDagBasic:
    """Test basic DAG creation functionality."""

    def test_simple_linear_dag(self, temp_jj_repo, dot_to_jj_script):
        """Test creating a simple linear DAG: plan -> todo -> scope -> @"""
        repo_path = temp_jj_repo

        # Create a simple DOT file
        dot_file = repo_path / "simple.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]
  plan0  [type=plan   label="add feature"]
  step0  [type=todo   label="implement feature"]
  temp0  [type=temp   label="handoff files"]
  scope0 [type=scope  label="add feature"]
  at     [type=at     label="@"]

  trunk  -> plan0
  plan0  -> step0
  plan0  -> temp0
  step0  -> scope0
  temp0  -> scope0
  scope0 -> at
}
""")

        # Create anchor map
        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        # Run the script with uv (to handle PEP 723 dependencies)
        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map)],
            repo_path
        )

        assert code == 0, f"Script failed: {err}"

        # Verify the DAG was created
        code, log_out, err = run_jj(
            ["jj", "log", "-r", "trunk()..@", "--no-pager",
             "--template", "description.first_line() ++ \"\\n\""],
            repo_path
        )
        assert code == 0

        # Check that all expected changes exist in some form
        lines = [l.strip() for l in log_out.strip().split('\n') if l.strip()]
        # Should have plan, step, temp, scope changes
        assert any("add feature" in l for l in lines), f"Missing plan change: {lines}"
        assert any("implement feature" in l for l in lines), f"Missing todo change: {lines}"
        assert any("handoff" in l for l in lines), f"Missing temp change: {lines}"
        # Note: scope might be implicit in the DAG structure

    def test_multi_route_dag(self, temp_jj_repo, dot_to_jj_script):
        """Test creating a DAG with parallel sub-routes."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "multi_route.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]
  plan0  [type=plan   label="add auth"]
  route1 [type=todo   label="add user model"]
  route2 [type=todo   label="add endpoints"]
  temp0  [type=temp   label="handoff files"]
  scope0 [type=scope  label="add auth"]
  at     [type=at     label="@"]

  trunk  -> plan0
  plan0  -> route1
  plan0  -> route2
  plan0  -> temp0
  route1 -> scope0
  route2 -> scope0
  temp0  -> scope0
  scope0 -> at
}
""")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map)],
            repo_path
        )

        assert code == 0, f"Script failed: {err}"

        # Verify both routes exist
        code, log_out, err = run_jj(
            ["jj", "log", "-r", "trunk()..@", "--no-pager",
             "--template", "description.first_line() ++ \"\\n\""],
            repo_path
        )
        assert code == 0

        lines = [l.strip() for l in log_out.strip().split('\n') if l.strip()]
        assert any("user model" in l for l in lines), f"Missing route1: {lines}"
        assert any("endpoints" in l for l in lines), f"Missing route2: {lines}"

    def test_sequential_dag(self, temp_jj_repo, dot_to_jj_script):
        """Test creating sequential steps (each depends on prior)."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "sequential.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]
  plan0  [type=plan   label="refactor"]
  step1  [type=todo   label="extract function A"]
  step2  [type=todo   label="extract function B"]
  step3  [type=todo   label="use both functions"]
  temp0  [type=temp   label="handoff"]
  scope0 [type=scope  label="refactor"]
  at     [type=at     label="@"]

  trunk  -> plan0
  plan0  -> step1
  step1  -> step2
  step2  -> step3
  plan0  -> temp0
  step3  -> scope0
  temp0  -> scope0
  scope0 -> at
}
""")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map)],
            repo_path
        )

        assert code == 0, f"Script failed: {err}"

        # Verify all steps exist
        code, log_out, err = run_jj(
            ["jj", "log", "-r", "trunk()..@", "--no-pager",
             "--template", "description.first_line() ++ \"\\n\""],
            repo_path
        )
        assert code == 0

        lines = [l.strip() for l in log_out.strip().split('\n') if l.strip()]
        assert any("function A" in l for l in lines), f"Missing step1: {lines}"
        assert any("function B" in l for l in lines), f"Missing step2: {lines}"
        assert any("use both" in l for l in lines), f"Missing step3: {lines}"


class TestDotToJjDagDryRun:
    """Test dry-run mode (no actual DAG creation)."""

    def test_dry_run_mode(self, temp_jj_repo, dot_to_jj_script):
        """Test --dry-run flag doesn't actually create changes."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "test.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]
  plan0  [type=plan   label="test"]
  at     [type=at     label="@"]
  trunk  -> plan0
  plan0  -> at
}
""")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        # Get initial state
        code, log_before, _ = run_jj(
            ["jj", "log", "-r", "trunk()..@", "--no-pager"],
            repo_path
        )

        # Run with --dry-run
        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map), "--dry-run"],
            repo_path
        )

        assert code == 0, f"Dry-run failed: {err}"
        assert "[DRY RUN]" in out, "Expected dry-run messages in output"

        # Verify nothing was created
        code, log_after, _ = run_jj(
            ["jj", "log", "-r", "trunk()..@", "--no-pager"],
            repo_path
        )

        assert log_before == log_after, "Dry-run should not modify repository"


class TestDotToJjDagErrorHandling:
    """Test error handling and validation."""

    def test_missing_dot_file(self, temp_jj_repo, dot_to_jj_script):
        """Test handling of missing DOT file."""
        repo_path = temp_jj_repo

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script),
             str(repo_path / "nonexistent.dot")],
            repo_path
        )

        assert code != 0, "Should fail with nonexistent DOT file"

    def test_invalid_dot_syntax(self, temp_jj_repo, dot_to_jj_script):
        """Test handling of invalid DOT syntax."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "invalid.dot"
        dot_file.write_text("this is not valid dot syntax {{{")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map)],
            repo_path
        )

        # Should fail gracefully
        assert code != 0 or "error" in err.lower() or "error" in out.lower()


class TestDotToJjDagAnnotatedOutput:
    """Test that output includes annotated DOT with jj_id."""

    def test_annotated_dot_output(self, temp_jj_repo, dot_to_jj_script):
        """Test that script outputs DOT with jj_id annotations."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "test.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]
  plan0  [type=plan   label="feature"]
  at     [type=at     label="@"]
  trunk  -> plan0
  plan0  -> at
}
""")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map), "--dry-run"],
            repo_path
        )

        assert code == 0
        # Should include annotated DOT output
        assert "jj_id=" in out, "Output should include annotated DOT with jj_id"
        assert "trunk()" in out, "Should preserve anchor jj_id"


class TestDotToJjDagComplexStructure:
    """Test more complex DAG structures."""

    def test_multiple_plans(self, temp_jj_repo, dot_to_jj_script):
        """Test DAG with multiple independent plan/feature branches."""
        repo_path = temp_jj_repo

        dot_file = repo_path / "complex.dot"
        dot_file.write_text("""
digraph {
  trunk  [type=anchor label="trunk()"]

  plan1  [type=plan   label="feature A"]
  step1a [type=todo   label="A step 1"]
  temp1  [type=temp   label="A handoff"]
  scope1 [type=scope  label="feature A"]

  plan2  [type=plan   label="feature B"]
  step2a [type=todo   label="B step 1"]
  temp2  [type=temp   label="B handoff"]
  scope2 [type=scope  label="feature B"]

  at     [type=at     label="@"]

  trunk  -> plan1
  trunk  -> plan2

  plan1  -> step1a
  plan1  -> temp1
  step1a -> scope1
  temp1  -> scope1

  plan2  -> step2a
  plan2  -> temp2
  step2a -> scope2
  temp2  -> scope2

  scope1 -> at
  scope2 -> at
}
""")

        anchor_map = repo_path / "anchors.txt"
        anchor_map.write_text("trunk = trunk()\n")

        code, out, err = run_jj(
            ["uv", "run", "--script", str(dot_to_jj_script), str(dot_file),
             "--anchor-map", str(anchor_map), "--dry-run"],
            repo_path
        )

        assert code == 0, f"Failed to process complex DAG: {err}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
