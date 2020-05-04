<?php 
	  if (!isset($_SESSION['USERID'])){
      redirect(web_root."admin/index.php");
     } 
?>
	<div class="row">
       	 <div class="col-lg-8">             
			

            <h1 class="page-header">Types of Graves  <a href="index.php?view=add" class="btn btn-primary btn-xs  ">  <i class="fa fa-plus-circle fw-fa"></i> New</a>  </h1>
       		</div>
        	<!-- /.col-lg-12 -->
   		 </div>

			<div class="container">
			<div class="DTTT btn-group">
	 		    <form action="controller.php?action=delete" Method="POST">  	
			     
				 <div class="table col-sm-8" >	
				 <div id="example">
				<table id="dash-table" class="table table-striped table-bordered table-hover"  style="font-size:12px" cellspacing="0">
				
				  <thead>
				  	<tr>
				  		<!-- <th>No.</th> -->
				  		<th>
				  		 <!-- <input type="checkbox" name="chkall" id="chkall" onclick="return checkall('selector[]');">  -->
				  		 Types</th> 
				  		 <th width="10%" align="center">Action</th>
				  	</tr>	
				  </thead>
	 
				  <tbody>
				  	<?php 
				  		$mydb->setQuery("SELECT * FROM `tblcategory`");
				  		$cur = $mydb->loadResultList();

						foreach ($cur as $result) {
				  		echo '<tr>';
				  		// echo '<td width="5%" align="center"></td>';
				  		// echo '<td>
				  		//      <input type="checkbox" name="selector[]" id="selector[]" value="'.$result->CATEGID. '"/>
				  		// 		' . $result->CATEGORIES.'</a></td>';
				  			echo '<td>' . $result->CATEGORIES.'</td>';
				  		echo '<td align="center"><a title="Edit" href="index.php?view=edit&id='.$result->CATEGID.'" class="btn btn-primary btn-xs  ">  <span class="mdi mdi-pencil"></a>
				  		     <a title="Delete" href="controller.php?action=delete&id='.$result->CATEGID.'" class="btn btn-danger btn-xs  ">  <span class="mdi mdi-close "></a></td>';
				  		// echo '<td></td>';
				  		echo '</tr>';
				  	} 
				  	?>
				  </tbody>
					
				</table>
				</div>
				</div>
			
</form>
</div>

