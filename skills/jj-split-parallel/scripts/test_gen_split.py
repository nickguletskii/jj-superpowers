#!/usr/bin/env python3
"""Unit tests for gen_split.py."""

import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, call, patch

# Import the module under test
sys.path.insert(0, os.path.dirname(__file__))
import gen_split


class TestParseRename(unittest.TestCase):
    def test_brace_rename_top_level(self):
        # R {old.rs => new.rs}  — full filename in braces
        src, dst = gen_split._parse_rename("R {old.rs => new.rs}")
        self.assertEqual(src, "old.rs")
        self.assertEqual(dst, "new.rs")

    def test_brace_rename_prefix(self):
        # R js/{cityvms_frontend => @cityvms/ui}/src/foo.ts
        src, dst = gen_split._parse_rename(
            "R js/{cityvms_frontend => @cityvms/ui}/src/foo.ts"
        )
        self.assertEqual(src, "js/cityvms_frontend/src/foo.ts")
        self.assertEqual(dst, "js/@cityvms/ui/src/foo.ts")

    def test_brace_rename_package_only(self):
        # R js/@cityvms/{dotnet-backend-client-zod => dataset-service-client}/tsconfig.json
        src, dst = gen_split._parse_rename(
            "R js/@cityvms/{dotnet-backend-client-zod => dataset-service-client}/tsconfig.json"
        )
        self.assertEqual(src, "js/@cityvms/dotnet-backend-client-zod/tsconfig.json")
        self.assertEqual(dst, "js/@cityvms/dataset-service-client/tsconfig.json")

    def test_no_brace_plain_path(self):
        src, dst = gen_split._parse_rename("R src/lib/foo.rs")
        self.assertEqual(src, "src/lib/foo.rs")
        self.assertEqual(dst, "src/lib/foo.rs")


class TestReadPairs(unittest.TestCase):
    def _write(self, content):
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
        f.write(content)
        f.close()
        return f.name

    def tearDown(self):
        pass  # tmp files cleaned up by OS

    def test_added_modified_deleted(self):
        path = self._write("A src/new.rs\nM src/old.rs\nD src/gone.rs\n")
        pairs = gen_split.read_pairs(path)
        self.assertEqual(pairs, [
            ("src/new.rs", "src/new.rs"),
            ("src/old.rs", "src/old.rs"),
            ("src/gone.rs", "src/gone.rs"),
        ])

    def test_rename_expands_correctly(self):
        path = self._write("R js/{old => new}/file.ts\n")
        pairs = gen_split.read_pairs(path)
        self.assertEqual(pairs, [("js/old/file.ts", "js/new/file.ts")])

    def test_blank_lines_ignored(self):
        path = self._write("\nA foo.rs\n\nM bar.rs\n")
        pairs = gen_split.read_pairs(path)
        self.assertEqual(len(pairs), 2)


class TestJjQuote(unittest.TestCase):
    def test_plain_path_single_quoted(self):
        # Plain paths: no jj double-quoting needed, just returned as-is
        result = gen_split._jj_quote("src/foo.rs")
        self.assertEqual(result, "src/foo.rs")

    def test_dollar_sign_double_quoted(self):
        result = gen_split._jj_quote("src/routes/$datasetId/gallery.tsx")
        self.assertEqual(result, '"src/routes/$datasetId/gallery.tsx"')

    def test_double_quote_in_path_escaped(self):
        result = gen_split._jj_quote('src/say_"hello".rs')
        self.assertEqual(result, '"src/say_\\"hello\\".rs"')

    def test_both_dollar_and_quote(self):
        result = gen_split._jj_quote('src/$foo_"bar".rs')
        self.assertIn('"', result[0])   # starts with jj double-quote
        self.assertIn('\\"bar\\"', result)


class TestAssignToGroups(unittest.TestCase):
    def _groups(self):
        return [
            {"message": "feat: rust", "patterns": ["^rust/"]},
            {"message": "feat: js",   "patterns": ["^js/"]},
        ]

    def test_basic_assignment(self):
        pairs = [
            ("rust/foo.rs", "rust/foo.rs"),
            ("js/bar.ts",   "js/bar.ts"),
        ]
        result = gen_split.assign_to_groups(self._groups(), pairs)
        self.assertIn("rust/foo.rs", result[0])
        self.assertIn("js/bar.ts",   result[1])

    def test_first_match_wins(self):
        groups = [
            {"message": "g1", "patterns": ["^src/"]},
            {"message": "g2", "patterns": ["^src/sub/"]},
        ]
        pairs = [("src/sub/file.rs", "src/sub/file.rs")]
        result = gen_split.assign_to_groups(groups, pairs)
        self.assertIn("src/sub/file.rs", result[0])
        self.assertEqual(result[1], [])

    def test_unmatched_file_in_no_group(self):
        pairs = [("docs/readme.md", "docs/readme.md")]
        result = gen_split.assign_to_groups(self._groups(), pairs)
        self.assertEqual(result[0], [])
        self.assertEqual(result[1], [])

    def test_rename_adds_both_paths(self):
        pairs = [("js/old/file.ts", "js/new/file.ts")]
        result = gen_split.assign_to_groups(self._groups(), pairs)
        self.assertIn("js/old/file.ts", result[1])
        self.assertIn("js/new/file.ts", result[1])

    def test_dollar_path_jj_quoted(self):
        pairs = [("js/routes/$id.tsx", "js/routes/$id.tsx")]
        result = gen_split.assign_to_groups(self._groups(), pairs)
        self.assertIn('"js/routes/$id.tsx"', result[1])

    def test_no_duplicate_paths(self):
        # Same src==dst should only appear once
        pairs = [("js/foo.ts", "js/foo.ts")]
        result = gen_split.assign_to_groups(self._groups(), pairs)
        self.assertEqual(result[1].count("js/foo.ts"), 1)


class TestExtractRemaining(unittest.TestCase):
    def test_extracts_change_id(self):
        output = (
            "Rebased 2 descendant commits\n"
            "Selected changes : yykkynwl abc12345 feat: group one\n"
            "Remaining changes: lkrtqmmm def67890 (no description set)\n"
        )
        result = gen_split._extract_remaining(output)
        self.assertEqual(result, "lkrtqmmm")

    def test_returns_none_if_absent(self):
        result = gen_split._extract_remaining("Warning: no changes selected\n")
        self.assertIsNone(result)

    def test_handles_empty_string(self):
        self.assertIsNone(gen_split._extract_remaining(""))


class TestJjWrapper(unittest.TestCase):
    @patch("gen_split.subprocess.run")
    def test_success_returns_output(self, mock_run):
        mock_run.return_value = MagicMock(
            returncode=0, stdout="ok\n", stderr=""
        )
        result = gen_split.jj("log", "--no-graph")
        self.assertEqual(result, "ok\n")

    @patch("gen_split.subprocess.run")
    @patch("gen_split.sys.exit")
    def test_failure_runs_undo_and_exits(self, mock_exit, mock_run):
        # First call fails, second call (undo) succeeds
        mock_run.side_effect = [
            MagicMock(returncode=1, stdout="", stderr="boom"),
            MagicMock(returncode=0, stdout="", stderr=""),
        ]
        gen_split.jj("split", "-r", "abc")
        mock_exit.assert_called_once_with(1)
        # Verify undo was called
        undo_call = mock_run.call_args_list[1]
        self.assertIn("undo", undo_call.args[0])


if __name__ == "__main__":
    unittest.main(verbosity=2)
