<?php
require_once ("include/initialize.php");
// if(isset($_SESSION['IDNO'])){
// 	redirect(web_root.'index.php');

// }

$content='home.php';
$view = (isset($_GET['q']) && $_GET['q'] != '') ? $_GET['q'] : '';
 

switch ($view) {
 
 case 'contacts' :
        $title="Contact Us";	
        $content='contacts.php';	
        require_once("contactstheme.php");	
		break;

	 case 'about' :
        $title="About Us";	
        $content='about.php';	
        require_once("about.php");	
		break;

	case 'person' :
        $title="Deceased Person";	
        $content='person.php';	
        require_once("burialrecordstheme.php");	
		break;
  
	default :
	    $title="Home";	
        $content ='home.php';	
        require_once("hometheme.php");	

}

       
    
 

 

?>

