<?php 
require_once("../include/initialize.php");
	 if (!isset($_SESSION['USERID'])){
      redirect(web_root."admin/login.php");
     } 

$content='home.php';
$view = (isset($_GET['page']) && $_GET['page'] != '') ? $_GET['page'] : '';
switch ($view) {
	case '1' :
        $title="Administrator Panel | Cemetery Mapping & Information System";	
		$content='home.php';		
		break;	
	default :
	    $title="Admin | Cemetery Mapping & Information System";	
		$content ='home.php';		
}
require_once("theme/templates.php");
?>