<?php

class DirectorySearch {
	private $dirs = array();
	private $inner_path = false;
	private $root;

	function __construct($root_path = '/', $inner_path = false, $depth = 0) {
		$this->root = $_SERVER['DOCUMENT_ROOT'] . $root_path;

		if ($inner_path && $inner_path != $root_path) {
			$this->inner_path = ltrim($inner_path, $root_path);

			// Get inner (current) path directories
			$this->get_directories($this->root . $this->inner_path, $depth);
		}

		// Get root directories
		$this->get_directories($this->root, $depth);
	}

	function get_directories($path, $depth) {
		if ($handler = opendir($path)) {
			while (false !== ($file = readdir($handler))) {
				if ($file[0] === '.' || !is_dir($path . $file))
					continue;

				$dirpath = $path . $file . '/';

				$this->dirs[] = $dirpath;

				if ($depth)
					$this->get_directories($dirpath, $depth-1);
			}
		}
	}

	function process_dirs() {
		$relative_dirs = array();

		$this->dirs = array_unique($this->dirs);

		foreach ($this->dirs as $dir) {
			$dir = ltrim($dir, $this->root);

			if (DIRECTORY_SEPARATOR == '\\')
				$dir = str_replace('\\', '/', $dir);

			$relative_dirs[] = $dir;
		}

		return array_filter($relative_dirs, array($this, 'filter'));
	}

	function filter($dir) {
		// Remove inner path from the results
		if ($dir == $this->inner_path)
			return false;

		// Remove theme from the results
		return strpos($dir, 'theme/') !== 0;
	}

	function get_results() {
		return $this->process_dirs();
	}
}

$depth 	= !empty($_GET['depth']) ? (int) $_GET['depth'] : 1;	// Directory search depth
$root	= !empty($_GET['root']) ? $_GET['root'] : '/'; 			// Relative root path
$path	= !empty($_GET['path']) ? $_GET['path'] : '/'; 			// Relative inner path

$directory_search = new DirectorySearch($root, $path, $depth);
$directories = $directory_search->get_results();

echo json_encode($directories);

die();
