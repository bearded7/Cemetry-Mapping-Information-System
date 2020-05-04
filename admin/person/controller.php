<?php
require_once ("../../include/initialize.php");
	 

$action = (isset($_GET['action']) && $_GET['action'] != '') ? $_GET['action'] : '';

switch ($action) {
	case 'add' :
	doInsert();
	break;
	
	case 'edit' :
	doEdit();
	break;
	
	case 'delete' :
	doDelete();
	break; 

	}

   
function doInsert(){
	global $mydb;
	if(isset($_POST['save'])){

		 
		
				
				// $borndate =  ($_POST['BORNDATE'] !='') ? @date_format(date_create($_POST['BORNDATE']), "Y-m-d"): '0000-00-00';
				// $dieddate =  ($_POST['DIEDDATE'] !='') ? @date_format(date_create($_POST['DIEDDATE']), "Y-m-d") : '0000-00-00';

				$borndate =  $_POST['BORNDATE'];
				$dieddate =  $_POST['DIEDDATE'];

		 
		 	
					if ($_POST['GRAVENO'] == ""  ) {
					$messageStats = false;
					message("Grave number is required!","error");
					redirect('index.php?view=add');
					}else{	

						$sql = "SELECT * FROM `tblpeople` WHERE `GRAVENO`= '".$_POST['GRAVENO']."'  AND  `CATEGORIES`='".$_POST['CATEGORIES']."' AND `LOCATION`='".$_POST['LOCATION']."'";
					    $mydb->setQuery($sql);
					    $cur = $mydb->loadSingleResult();

					    if (@$cur->GRAVENO== $_POST['GRAVENO']) {
					    	# code...
					    	message("Grave number is already exists!","error");
							redirect('index.php?view=add');
					    }else{

						$filename = UploadImage("personImage");
						$personImage = "files/". $filename ;

						$filename = UploadImage("graveImage");
						$graveImage = "files/". $filename ;

						$filename = UploadImage("attachmentfile");
						$attachmentfile = "files/". $filename ;

						$autonumber = New Autonumber();
						$res = $autonumber->set_autonumber('PEOPLEID');

  				 	 	$p = New Person(); 
						$p->PEOPLEID 	= $res->AUTO; 
						$p->GRAVENO		= $_POST['GRAVENO']; 
						$p->NAME 		= $_POST['NAME'];
						$p->SEX 		= $_POST['SEX'];
						$p->BORNDATE	= $borndate;
						$p->DIEDDATE	= $dieddate; 
						$p->CATEGORIES  = $_POST['CATEGORIES'];
						$p->LOCATION 	= $_POST['LOCATION']; 
						$p->BURIALTYPE	= $_POST['BURIALTYPE']; 
						$p->MEMORABILIA	= $_POST['MEMORABILIA'];
						$p->PHOTO		= $personImage; 
						$p->GRAVEPIC	= $graveImage; 
						$p->attachmentfile	= $attachmentfile; 
						$p->create();
						// }

  

						$autonumber = New Autonumber();
						$autonumber->auto_update('PEOPLEID');



						message("New Record created successfully!", "success");
						redirect("index.php");

					    }

		 
					}
						
				}
		}
			  
 
	function doEdit(){ 
 

		if(isset($_POST['save'])){ 

				// $borndate =  ($_POST['BORNDATE'] !='' || $_POST['BORNDATE'] !='0m/dd/yyyy') ? @date_format(date_create($_POST['BORNDATE']), "Y-m-d"): '0000-00-00';
				// $dieddate =  ($_POST['DIEDDATE'] !='' || $_POST['DIEDDATE'] !='0m/dd/yyyy') ? @date_format(date_create($_POST['DIEDDATE']), "Y-m-d") : '0000-00-00';

						$filename = UploadImage("personImage");
						echo $personImage = "files/". $filename ;

						$filename = UploadImage("graveImage");
						echo $graveImage = "files/". $filename ;

						$filename = UploadImage("attachmentfile");
						echo $attachmentfile = "files/". $filename ;


						$borndate =  $_POST['BORNDATE'];
						$dieddate =  $_POST['DIEDDATE'];
						
  				 	 	$p = New Person();  
						$p->GRAVENO		= $_POST['GRAVENO']; 
						$p->NAME 		= $_POST['NAME'];
						$p->SEX 		= $_POST['SEX'];
						$p->BORNDATE	= $borndate;
						$p->DIEDDATE	= $dieddate; 
						$p->CATEGORIES  = $_POST['CATEGORIES'];
						$p->LOCATION 	= $_POST['LOCATION'];
						$p->MEMORABILIA	= $_POST['MEMORABILIA'];
						$p->BURIALTYPE	= $_POST['BURIALTYPE']; 
						

						if ($personImage=="files/" || $personImage=="") {
							# code...
						}else{
						$p->PHOTO		= $personImage; 
						}

						if ($graveImage=="files/" || $graveImage=="") {
							# code...
						}else{
						$p->GRAVEPIC	= $graveImage;  
						}
						if ($attachmentfile=="files/" || $attachmentfile=="") {
							# code...
						}else{
						$p->attachmentfile	= $attachmentfile; 

						}

						$p->update($_POST['PEOPLEID']);
  

			message("Record has been updated!", "success");
			redirect("index.php");
	  } 
}

	function doDelete(){

 
 

		if (isset($_POST['selector'])==''){
			message("Select the records first before you delete!","error");
			redirect('index.php');
			}else{

			$id = $_POST['selector'];
			$key = count($id);

			for($i=0;$i<$key;$i++){ 

			$p = New Person();
			$p->delete($id[$i]);
  

			message("Record has been Deleted!","info");
			redirect('index.php');

			}
		}

	}

	function UploadImage($imgname=""){
			$target_dir = "files/";
		    $target_file = $target_dir  . basename($_FILES[$imgname]["name"]);
			$uploadOk = 1;
			$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
			
			
			if($imageFileType != "jpg" || $imageFileType != "png" || $imageFileType != "jpeg"
				|| $imageFileType != "gif" || $imageFileType != "docs" || $imageFileType != "mp4") {
				 if (move_uploaded_file($_FILES[$imgname]["tmp_name"], $target_file)) {
					return   basename($_FILES[$imgname]["name"]);
				}else{
					// echo "Error Uploading File";
					// exit;
				}
			}else{
					// echo "File Not Supported";
					// exit;
	 }
}
		 
?>