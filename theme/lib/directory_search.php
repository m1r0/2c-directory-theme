<?php

class DirectorySearch {
	private $results = array();
	private $root;

	function __construct($depth = 0, $relative_path = '/') {
		$this->root = $_SERVER['DOCUMENT_ROOT'];

		$root_dirs = $this->get_directories($this->root, $depth);
		$path_dirs = $this->get_relative_directories($relative_path, $depth);

		if ($path_pos = array_search(ltrim($relative_path, '/'), $root_dirs)) {
			unset($root_dirs[$path_pos]);
		}

		$this->results = array_merge($path_dirs, $root_dirs);
	}

	function get_directories($path, $depth) {
		$dirs = array();

		$di = new DirectoryIterator($path);

		foreach ($di as $fileinfo) {
			if ($fileinfo->isDir() && !$fileinfo->isDot() && strpos($fileinfo->getFilename(), '.') === false) {
				$relative_path = preg_replace('~^' . preg_quote($this->root) . '[\/\\\]?~', '', $fileinfo->getPathName());

				$relative_path = str_replace($this->root . DIRECTORY_SEPARATOR, '', $fileinfo->getPathName());

				$dirs[] = str_replace('\\', '/', $relative_path) . '/';

				if ($depth) {
					$sub_dirs = $this->get_directories($fileinfo->getPathName(), $depth - 1);

					foreach ($sub_dirs as $d) {
						$dirs[] = $d;
					}
				}
			}
		}

		return $dirs;
	}

	function get_relative_directories($path, $depth) {
		$dirs = array();

		if ($path != '/' && is_dir($this->root . $path)) {
			$dirs = $this->get_directories($this->root . $path, $depth);
		}

		return $dirs;
	}

	function get_results() {
		$results = array_unique(array_filter($this->results));

		return $results;
	}
}

$depth = isset($_GET['depth']) ? (int) $_GET['depth'] : 0;
$path = isset($_GET['path']) ? $_GET['path'] : '/';

$directory_search = new DirectorySearch($depth, $path);

$directories = $directory_search->get_results();

echo json_encode($directories);

die();
