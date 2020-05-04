<?php
 require_once ("include/initialize.php"); 
 $search = $_POST['prefixText'];
	$sql = "SELECT * FROM tblpeople WHERE  NAME LIKE '%".$search."%'";
	$mydb->setQuery($sql);  
	$cur = $mydb->loadResultList();

	foreach ($cur as $res) { 
	$name[] = $res->NAME
	}

 
echo json_encode($name);
?>