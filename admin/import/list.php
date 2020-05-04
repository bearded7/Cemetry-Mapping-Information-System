<?php 
	  if (!isset($_SESSION['USERID'])){
      redirect(web_root."admin/index.php");
     } 
?>

	<div class="container">
		<h1 class="page-header"> Import Records File</h1>
			
				<form class="form-horizontal well" action="import.php" method="post" name="upload_excel" enctype="multipart/form-data">
					<fieldset>
						<legend style="margin-left:210px;">Import a CSV/Excel file to update Burial Records</legend>
						<div class="control-group">
							<div class="control-label">
								<label style="margin-left:420px;">CSV/Excel File:</label>
							</div>
							<br>
							<div class="controls" style="margin-left:370px;">
								<input type="file" name="file" id="file" class="input-large">
							</div>
						</div>
						<br>
						<div class="control-group" style="margin-left:420px;">
							<div class="controls">
							<button type="submit" id="submit" name="Import" class="btn btn-primary button-loading" data-loading-text="Loading...">Upload</button>
							</div>
						</div>
					</fieldset>
				</form>
			</div>

		