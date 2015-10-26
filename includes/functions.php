<?php
define('WATERMARK_OVERLAY_OPACITY', 80);
define('WATERMARK_OUTPUT_QUALITY', 100);
define('PHOTO_WIDTH', 1920);
define('PHOTO_HEIGHT', 1080);
define('STRIP_SPACING',60);

function array_val($r, $key, $default = null) {
  return isset($r[$key]) ? $r[$key] : $default;
}
function he($str) {
  return htmlentities($str, ENT_COMPAT, 'UTF-8');
}
function take_photo($id, $max_photos = null) {
  if (!isset($_SESSION['photo_number_' . $id])) {
    $_SESSION['photo_number_' . $id] = 1;
  } else {
    $_SESSION['photo_number_' . $id]++;
  }
  if (!isset($_SESSION['spookified_' . $id])) {
    $_SESSION['spookified_' . $id] = false;
  }
  $photo_file = $id . '_' . $_SESSION['photo_number_' . $id] . '.jpeg';
  $cmd = CAPTURE_CMD . ' ' . PHOTO_PATH . '/originals/' . $photo_file;
  $cmd_response = shell_exec($cmd);

  // Make sure a ghost gets added to every strip
  /*if (!$_SESSION['spookified_' . $id]) {
    $odds = 4 - $_SESSION['photo_number_' . $id];
    if ($max_photos == $_SESSION['photo_number_' . $id]) {
      $odds = 1;
    }
  } else {
    $odds = 20;
  }*/

  $odds = 20;
  copy(PHOTO_PATH . '/originals/' . $photo_file, PHOTO_PATH . '/modified/' . $photo_file);
  if (rand(1, $odds) == 1) {
    spookify(PHOTO_PATH . '/modified/' . $photo_file);
    $_SESSION['spookified_' . $id] = true;
  }
  return json_encode(array(
    'photo_src' => PUBLIC_PHOTO_PATH . 'originals/' . $photo_file,
  ));
}

function add_footer($source_file_path, $output_file_path) {
  list($source_width, $source_height) = getimagesize($source_file_path);
  $source_gd_image = imagecreatefromjpeg($source_file_path);

  $footer_image_path = get_random_footer();
  $footer_image = imagecreatefrompng($footer_image_path);
  list($footer_width, $footer_height) = getimagesize($footer_image_path);
  $image_width = $source_width;
  $image_height = $source_height + $footer_height;

  $image = imagecreatetruecolor($image_width, $image_height);
  $white = imagecolorallocate($image, 255, 255, 255);
  imagefilledrectangle($image, 0, 0, $image_width, $image_height, $white);


  imagecopy($image,$source_gd_image,0,0,0,0,$source_width,$source_height);
  imagecopy($image,$footer_image,0,$source_height,0,0,$footer_width,$footer_height);

  ob_start();
  imagejpeg($image);
  imagedestroy($image);
  $image_data = ob_get_contents();
  ob_end_clean();

  file_put_contents($output_file_path, $image_data);
}

function add_overlay($source_file_path, $output_file_path, $position) {
  list($source_width, $source_height) = getimagesize($source_file_path);
  $source_gd_image = imagecreatefromjpeg($source_file_path);
  $overlay_gd_image = imagecreatefrompng(get_random_overlay());
  $overlay_width = imagesx($overlay_gd_image);
  $overlay_height = imagesy($overlay_gd_image);
  switch ($position) {
  case "topleft":
    imagecopymerge($source_gd_image, $overlay_gd_image, 0, 0, 0, 0, $overlay_width, $overlay_height, WATERMARK_OVERLAY_OPACITY);
    break;
  case "topright":
    imagecopymerge($source_gd_image, $overlay_gd_image, $source_width - $overlay_width, 0, 0, 0, $overlay_width, $overlay_height, WATERMARK_OVERLAY_OPACITY);
    break;
  case "bottomright":
    imagecopymerge($source_gd_image, $overlay_gd_image, $source_width - $overlay_width, $source_height - $overlay_height, 0, 0, $overlay_width, $overlay_height, WATERMARK_OVERLAY_OPACITY);
    break;
  case "bottomleft":
    imagecopymerge($source_gd_image, $overlay_gd_image, 0, $source_height - $overlay_height, 0, 0, $overlay_width, $overlay_height, WATERMARK_OVERLAY_OPACITY);
    break;
  }
  imagejpeg($source_gd_image, $output_file_path, WATERMARK_OUTPUT_QUALITY);
  imagedestroy($source_gd_image);
  imagedestroy($overlay_gd_image);
}

function combine_and_finish($id) {
  $files = array();
  $photo_count = $_SESSION['photo_number_' . $id];
  for ($i = 1; $i <= $photo_count; $i++) {
    $files[] = $id . '_' . $i . '.jpeg';
  }
  $combined_file = combine_photos($files);
  //add_overlay(PHOTO_PATH . 'strips/' . basename($combined_file), PHOTO_PATH . 'stripsoverlay/' . basename($combined_file), "topleft");
  add_footer(PHOTO_PATH . 'strips/' . basename($combined_file), PHOTO_PATH . 'stripsfooter/' . basename($combined_file));
  printPhoto(PHOTO_PATH . 'stripsfooter/' . basename($combined_file));
  echo json_encode(array(
    'photo_src' => PUBLIC_PHOTO_PATH . '/strips/' . basename($combined_file) ,
  ));
}
function spookify($file) {
  $resized_width = PHOTO_WIDTH;
  $resized_height = PHOTO_HEIGHT;
  list($full_width, $full_height) = getimagesize($file);
  $image = imagecreatefromjpeg($file);
  $resized_image = imagecreatetruecolor($resized_width, $resized_height);
  imagecopyresampled($resized_image, $image, 0, 0, 0, 0, $resized_width, $resized_height, $full_width, $full_height);
  $ghost_file = get_random_ghost();
  list($ghost_width, $ghost_height) = getimagesize($ghost_file);
  $ghost = imagecreatefrompng($ghost_file);
  imagecopyresampled($resized_image, $ghost, 0, 0, 0, 0, $resized_width, $resized_height, $ghost_width, $ghost_height);
  ob_start();
  imagejpeg($resized_image);
  imagedestroy($resized_image);
  $image_data = ob_get_contents();
  ob_end_clean();
  file_put_contents($file, $image_data);
}

function get_random_png($path){
  $files = array();
  foreach(scandir($path) as $file) {
    if (preg_match('/\.png$/', $file)) {
      $files[] = $path . $file;
    }
  }
  return $files[array_rand($files)];
}
function get_random_ghost() {
  return get_random_png(APP_ROOT . 'themes/' . THEME . '/ghosts/');
}
function get_random_overlay() {
  return get_random_png(APP_ROOT . 'themes/' . THEME . '/overlays/');
}
function get_random_footer() {
  return get_random_png(APP_ROOT . 'themes/' . THEME . '/footers/');
}

function combine_photos($files) {
  $resized_width = PHOTO_WIDTH;
  $resized_height = PHOTO_HEIGHT;
  $offset = STRIP_SPACING;
  $image_width = $resized_width + ($offset * 2);
  $image_height = (count($files) * ($resized_height + $offset)) + $offset;
  $image = imagecreatetruecolor($image_width, $image_height);
  $white = imagecolorallocate($image, 255, 255, 255);
  imagefilledrectangle($image, 0, 0, $image_width, $image_height, $white);
  foreach($files as $i => $file_name) {
    $file = PHOTO_PATH . '/modified/' . $file_name;
    list($full_width, $full_height) = getimagesize($file);
    $photo = imagecreatefromjpeg($file);
    $dst_y = ($i * $resized_height) + (($i + 1) * $offset);
    imagecopyresampled($image, $photo, $offset, $dst_y, 0, 0, $resized_width, $resized_height, $full_width, $full_height);
  }
  ob_start();
  imagejpeg($image);
  imagedestroy($image);
  $image_data = ob_get_contents();
  ob_end_clean();
  $time = date("y.m.d G.i.s");
  $tmp_file = PHOTO_PATH . 'strips/' . $time . '.jpeg';
  file_put_contents($tmp_file, $image_data);
  return $tmp_file;
}

function printPhoto($file) {
  $cmd = PRINT_CMD . " '" . $file . "'";
  $cmd_response = shell_exec($cmd);
  error_log("PRINT COMMAND : " . $cmd . " RESPONSE : " . $cmd_response);
}
