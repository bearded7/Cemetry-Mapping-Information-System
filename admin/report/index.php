<?php
require_once("../../include/initialize.php");
	if(!isset($_SESSION['USERID'])){
	redirect(web_root."admin/index.php");
}
 // if (!isset($_SESSION['justadmin_ID'])){
 // 	redirect(WEB_ROOT ."admin/login.php");
 // }
$view = (isset($_GET['view']) && $_GET['view'] != '') ? $_GET['view'] : '';
$title ='Reports | Cemetery Mapping & Information System';
switch ($view) {
	case 'list' :

		$content    = 'list.php';		
		break;
	// case 'list' :
	// 	$content    = 'list.php';		
	// 	break;	
			
	default :
		$content    = 'list.php';		
}
  // include '../modal.php';
require_once '../theme/templates.php';
?>


  
