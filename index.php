<?php
require 'header.php';

$action = array_val($_GET, 'action');

switch ( $action ) {
  case 'take_photo':
    echo take_photo($_GET['id'], $_GET['photos_to_take']);
    break;

  case 'combine_and_finish':
    echo combine_and_finish($_GET['id']);
    exit;

  case 'print_photo':
    echo print_strip($_GET['filename']);
    exit;


  default:
    $strips = array();
    $files = scandir(PHOTO_PATH . "/strips", 1);

    foreach ( $files as $file ) {
    	if ( preg_match('/^(.*)\.(jpg|jpeg)$/', $file) ) {
    		$strips[] = 'photos/strips/'.$file;
    	}
    }

    // try to keep the page from becoming impossible to load
    $strips = array_slice($strips, 0, 50);

    require APP_ROOT.'themes/'.THEME.'/index.htm';
}

?>
