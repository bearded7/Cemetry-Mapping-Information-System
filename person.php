<?php 
$search = isset( $_POST['search']) ? $_POST['search'] : "";
//$search = isset( $_GET['name']) ? $_GET['name'] : "";
$location = isset($_GET['location']) ? $_GET['location'] : '';


?>


<style type="text/css">



/*.scroll-table-container {
border:2px solid green; 
height: auto; 
overflow: scroll;
}
.scroll-table, div, th {
border-collapse:collapse; 
border:1px solid #777; 
min-width: 100px;} */

/*.stretch {

text-align: center;
}
.stretch img {
width: 15%; 
}*/

/*.scrollxy {
   width: auto;
   height:340px;
    /*border: thin solid black;*/
   /* overflow: auto; */
    /*overflow-y: hidden;*/
/*}*/

/*.dtburialrecordsWrapper {
        max-width: auto;
        margin: 0 auto;


    }
    
    #dtburialrecords th,
    td {
        white-space: nowrap;

    }
    
    table.dataTable thead .sorting:after,
    table.dataTable thead .sorting:before,
    table.dataTable thead .sorting_asc:after,
    table.dataTable thead .sorting_asc:before,
    table.dataTable thead .sorting_asc_disabled:after,
    table.dataTable thead .sorting_asc_disabled:before,
    table.dataTable thead .sorting_desc:after,
    table.dataTable thead .sorting_desc:before,
    table.dataTable thead .sorting_desc_disabled:after,
    table.dataTable thead .sorting_desc_disabled:before {
        bottom: .5em;
    }*/



table {
  border-collapse: collapse;
  width: 300px;
  overflow-x: scroll;
  display: block;
}

thead {
  background-color: #EFEFEF;
}

thead,
tbody {
  display: block;
}

tbody {
  overflow-y: scroll;
  overflow-x: hidden;
  height: 340px;
}

td,
th {
  min-width: 100px;
  height: 25px;
  border: dashed 1px lightblue;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}





</style>

 

 <h2><span>&nbsp;&nbsp;Details of Deceased Persons</span></h2>

 <div class="container">
  <div class="row">
  
      <div class="table-responsive">
        <table class="table" id="table">
							<thead>
							<tr>
								<th>Grave No</th>
								<th>Name</th>
								<th>Gender</th>
								<th>Age</th>
								<th>Photo of Deceased</th>
								<th>Born on</th>
								<th>Died on</th>
								<th>Years Buried</th>
								<th>Photo of Grave</th>
								<th>Burial Location</th>
								<th>Msg on Tombstone</th>
							</tr>		
							</thead>
							<tbody>
 
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
	$sql = "SELECT * FROM tblpeople WHERE  GRAVENO LIKE '%".$search."%' OR NAME LIKE '%".$search."%'";
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
		echo '<td class="nb_custom_td" style="text-align: center;">'.$res->GRAVENO.'</td>';
		echo '<td><a href="index.php?q=person&graveno='.$res->GRAVENO.'&name='.$res->NAME.'&location='.$res->LOCATION.'&section='.$res->CATEGORIES.'">'. $res->NAME.'</a></td>';
		echo '<td>' .$res->SEX. '</td>';
		echo '<td class="nb_custom_td" style="text-align: center;">' .$age. '</td>';
?>
		<td><img src="<?php echo web_root.'admin/person/'.$res->PHOTO;?>"> </td>
<?php
		echo '<td>'.$res->BORNDATE.'</td>';
		echo '<td>'.$res->DIEDDATE.'</td>';
		echo '<td class="nb_custom_td" style="text-align: center;">'.$buried.'</td>';	
		?>
		<td> <img src="<?php echo web_root.'admin/person/'.$res->GRAVEPIC;?>"> </td>
<?php
		echo '<td>'.$res->LOCATION.'</td>';
		
		echo '<td>' .$res->MEMORABILIA. '</td>';
		
		
		echo '</tr>';

	}

}else{
		echo '<tr>'; 
		echo '<td colspan="5" style="text-align:center">No Record Found!</td>'; 
		echo '</tr>'; 
}
	  

?>
<script>
$('table').on('scroll', function() {
  $("#" + this.id + " > *").width($(this).width() + $(this).scrollLeft());
});
</script>
  

</tbody>

</table>

</div>
</div>
</div>
</div>
</div>
</div>

