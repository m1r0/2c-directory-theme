<?php

class DirectoryCrawler {

	/**
	 * Relative root directory path.
	 *
	 * @var string
	 */
	protected $root_path;

	/**
	 * Relative current directory path.
	 *
	 * @var string
	 */
	protected $current_path;

	/**
	 * Crawled directories.
	 *
	 * @var array
	 */
	protected $directories = array();

	/**
	 * Construct the crawler.
	 *
	 * @param  string  $root_path
	 * @param  string  $current_path
	 * @param  integer $depth
	 * @return void
	 */
	function __construct( $root_path = '/', $current_path = '/', $depth = 0 ) {
		$this->root_path    = $root_path;
		$this->current_path = $current_path;

		// Crawl the current path directories first
		$this->crawl( $current_path, $depth );

		// Crawl the root directories if the current path is not the root
		if ( $root_path !== $current_path ) {
			$this->crawl( $root_path, $depth );
		}
	}

	/**
	 * Crawl a path and store all directories.
	 *
	 * @param  string  $path  (relative)
	 * @param  integer $depth
	 * @return void
	 */
	function crawl( $path, $depth = 0 ) {
		$full_path = $_SERVER[ 'DOCUMENT_ROOT' ] . $path;
		$handler   = opendir( $full_path );

		if ( !$handler ) {
			return false;
		}

		while ( false !== ( $file = readdir( $handler ) ) ) {
			if ( $file[0] === '.' || !is_dir( $full_path . $file ) ) {
				continue;
			}

			$dir_path = $path . $file . '/';


			if ( isset( $this->directories[ $dir_path ] ) ) {
				continue;
			}

			$this->directories[ $dir_path ] = $dir_path;

			if ( $depth ) {
				$this->crawl( $dir_path, $depth - 1 );
			}
		}
	}

	/**
	 * Get the crawled directories.
	 *
	 * @return array
	 */
	function get_directories() {
		$directories = array_filter( $this->directories, array( $this, 'filter_directories' ) );
		$directories = array_map( array( $this, 'remove_root_path' ) , $directories );

		return array_values( $directories );
	}

	/**
	 * Directories filter.
	 *
	 * @param  string  $directory
	 * @return boolean
	 */
	function filter_directories( $directory ) {
		// Remove the current path from the results
		if ( $directory == $this->current_path ) {
			return false;
		}

		return true;
	}

	/**
	 * Remove the root path from the beginning of the directory.
	 *
	 * @param  string  $directory
	 * @return string
	 */
	function remove_root_path( $directory ) {
		return substr( $directory, strlen( $this->root_path ) );
	}

} // DirectoryCrawler

$root_path    = !empty( $_GET[ 'root_path' ] )    ? $_GET[ 'root_path' ]    : null;
$current_path = !empty( $_GET[ 'current_path' ] ) ? $_GET[ 'current_path' ] : null;
$depth        = !empty( $_GET[ 'depth' ] )        ? $_GET[ 'depth' ]        : 0;

$crawler          = new DirectoryCrawler( $root_path, $current_path, $depth );
$directories      = $crawler->get_directories();
$directories_json = json_encode( $directories );

die( $directories_json );
