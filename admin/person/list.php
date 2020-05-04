


<style type="text/css">



	</style>

<?php
		check_message(); 
		?> 

<div class="row">
<div class="col-lg-12">


            <h1 class="page-header" >List of Deceased Persons  <a href="index.php?view=add" class="btn btn-primary btn-xs  ">  <i class="fa fa-plus-circle fw-fa"></i> New</a>  </h1>
			<div class="container">
			<form action="controller.php?action=delete" Method="POST"> 
			<div class="table-responsive">
			<div id="example">
       			 <table  id="dash-table" class="table table-bordered table-hover "  style="font-size:12px" cellspacing="0" >
					
				  <thead> 
				  		<th>Grave No.</th> 
				  		<th>Name of the Deceased</th>
				  		<th>Gender</th>
				  		<th>Age</th>
				  		<th>Born</th>
				  		<th>Died</th> 
						<th>Years Buried</th>
						<th>Photo of the Deceased</th>    
				  		<th>Location</th>
						<th>Grave Type</th>
				  		<th>Photo of Grave</th>  
						<th>Msg on Tombstone</th>
						<th>Comments on Burial</th>
				  		<th>AttachmentFile</th>   
				  </thead> 	

			  <tbody>

			  <?php 
$search = isset( $_POST['search']) ? $_POST['search'] : "";
//$search = isset( $_GET['name']) ? $_GET['name'] : "";
$location = isset($_GET['location']) ? $_GET['location'] : '';
?>

<?php

if (isset($_GET['location'])) {
	# code...
	if (isset($_GET['name'])) {
		# code...
		$sql = "SELECT * FROM tblpeople WHERE LOCATION='".$location."' AND GRAVENO = '".$_GET['graveno']."' AND NAME ='".$_GET['name']."'";
		$mydb->setQuery($sql);
		$cur = $mydb->executeQuery();
		$numrows = $mydb->num_rows($cur);//get the number of count
	}else{
		$sql = "SELECT * FROM tblpeople WHERE LOCATION='".$location."'";
		$mydb->setQuery($sql);
		$cur = $mydb->executeQuery();
		$numrows = $mydb->num_rows($cur);//get the number of count
	}
 
}elseif (isset( $_POST['search'])){
	$sql = "SELECT * FROM tblpeople WHERE NAME LIKE '%".$search."%'";
	$mydb->setQuery($sql);
	$cur = $mydb->executeQuery();
	$numrows = $mydb->num_rows($cur);//get the number of count
}else{
	$sql = "SELECT * FROM tblpeople";
	$mydb->setQuery($sql);
	$cur = $mydb->executeQuery();
	$numrows = $mydb->num_rows($cur);//get the number of count
}

# code...
if ($numrows > 0) {
		# code... 
	  $cur = $mydb->loadResultList();

	foreach ($cur as $res) {

		//date in mm/dd/yyyy format; or it can be in other formats as well
// $birthDate = "12/17/1983";

@$formatdate = date_format(date_create($res->DIEDDATE),'m/d/Y');
$birthDate = $formatdate;
//explode the date to get month, day and year
$birthDate = explode("/", $birthDate);
//get age from date or birthdate
@$buried = (date("md", date("U", mktime(0, 0, 0, $birthDate[0], $birthDate[1], $birthDate[2]))) > date("md")
? ((date("Y") - $birthDate[2]) - 1)
: (date("Y") - $birthDate[2]));
// echo "Age is:" . $age;
$borndate =  ($res->BORNDATE !='0000-00-00') ? date_format(date_create($res->BORNDATE), "m/d/Y"): 'NONE';
$dieddate =  ($res->DIEDDATE !='0000-00-00') ? date_format(date_create($res->DIEDDATE), "m/d/Y") : 'NONE';


$age = date_diff(date_create($borndate),date_create($dieddate))->y;
						  
						echo '<tr>';
				  		echo '<td width="1%" align="center"><input type="checkbox" name="selector[]" id="selector[]" value="'.$res->PEOPLEID. '"/>'. $res->GRAVENO.'</td>'; 
				  		// echo '<td><a title="edit" href="'.web_root.'admin/person/index.php?view=edit&id='.$result->PEOPLEID.'"><i class="fa fa-pencil "></i>'.$result->LNAME.', '.$result->FNAME.' '.$result->MNAME.'</a></td>';
				  				echo '<td><a title="edit" href="'.web_root.'admin/person/index.php?view=edit&id='.$res->PEOPLEID.'"><i class="mdi mdi-pencil "></i>'.$res->NAME.'</a></td>';
				  		echo '<td>'. $res->SEX.'</td>'; 
						echo '<td>'. $age.'</td>'; 
				  		echo '<td>'. $borndate.'</td>'; 
						echo '<td>'. $dieddate.'</td>';
						echo '<td>'. $buried.'</td>';
						echo '<td class="stretch"><img src='. $res->PHOTO.' ></td>';  
						echo '<td>'. $res->LOCATION.'</td>'; 
						echo '<td>'. $res->CATEGORIES.'</td>';   
						echo '<td class="stretch"><img src='. $res->GRAVEPIC.' ></td>'; 
						echo '<td>'. $res->MEMORABILIA.'</td>';  
						echo '<td>'. $res->BURIALTYPE.'</td>';
				  		if ($res->attachmentfile=="files/" || $res->attachmentfile==""  ) {
				  			# code...
				  			echo '<td>None</td>';
				  		}else{ 
				  			echo '<td><a href='.$res->attachmentfile.'><i class="mdi mdi-content-save"></i>'. $res->attachmentfile.'</a></td>';
				  		} 
				  		echo '</tr>';
				  	} 

				  }
				  	?>
				  </tbody>
					
				 	
				</table>

				<div class="btn-group">
				  
				  <button type="submit" class="btn btn-default" name="delete"><i class="mdi mdi-close"></i> Delete Selected Records</button>
				</div>
				</div>
				</form>
				</div>
				</div>
				</div>
				</div>
				</div>
				</div>

					



		