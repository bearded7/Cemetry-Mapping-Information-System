<?php
	 if (!isset($_SESSION['USERID'])){
      redirect(web_root."admin/index.php");
     }

?>

<div class="row">
       	 <div class="col-lg-12">
            <h1 class="page-header">List of Users  <a href="index.php?view=add" class="btn btn-primary btn-xs  ">  <i class="fa fa-plus-circle fw-fa"></i> New</a>  </h1>

			<div class="container">

	 		    <form action="controller.php?action=delete" Method="POST">  
			      <div class="table-responsive">	
				  <div id="example">
				<table id="dash-table" class="table table-striped table-bordered table-hover table-responsive">

				  <thead>
				  	<tr>
				  		<!-- <th>#</th> -->
				  		<th>
				  		 <!-- <input type="checkbox" name="chkall" id="chkall" onclick="return checkall('selector[]');">  -->
				  		 Account Name</th>
				  		<th>Username</th>
				  		<th>Role</th>
				  		<th width="10%" >Action</th>
				 
				  	</tr>	
				  </thead> 
				  
				  <tbody>
				  	<?php 

				  		$mydb->setQuery("SELECT * 
											FROM  `tbluseraccount`");
				  		$cur = $mydb->loadResultList();

						foreach ($cur as $result) {
				  		echo '<tr>';
				  		// echo '<td width="5%" align="center"></td>';
				  		echo '<td>' . $result->U_NAME.'</a></td>';
				  		echo '<td>'. $result->U_USERNAME.'</td>';
				  		echo '<td>'. $result->U_ROLE.'</td>';
				  		If($result->USERID==$_SESSION['USERID'] || $result->U_ROLE=='MainAdministrator' || $result->U_ROLE=='Administrator') {
				  			$active = "Disabled";

				  		}else{
				  			$active = "";

				  		}

				  		echo '<td align="center" > <a title="Edit" href="index.php?view=edit&id='.$result->USERID.'"  class="btn btn-primary btn-xs  ">  <span class=" mdi mdi-pencil "></span></a>
				  					 <a title="Delete" href="controller.php?action=delete&id='.$result->USERID.'" class="btn btn-danger btn-xs" '.$active.'><span class=" mdi mdi-close "></span> </a>
				  					 </td>';
				  		echo '</tr>';
				  	} 
				  	?>
				  </tbody>

				</table>
 
			</div>
				</form>
	

</div> <!---End of container-->

					</div>
   		 		</div>
			</div>
   		 </div>