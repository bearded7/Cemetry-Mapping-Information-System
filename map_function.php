
<style type="text/css">

	.grave{
		font-size: 8px;
		text-align: center;
	} 

	.grave .graveborder { 
		border-width:1px;
		border-style:solid;
		border-bottom-color:#aaa;
		border-right-color:#aaa;
		border-top-color:#ddd;
		border-left-color:#ddd;
		border-radius:3px;
		-moz-border-radius:3px;
		-webkit-border-radius:3px;
		border:.5px solid #ddd;
		border-color: #eee; 
		border-style: solid;

		border-style: solid;
		border-left: 1px solid #4e514e;
		border-right: 1px solid #4e514e;
		border-top: 1px solid #4e514e;
		border-bottom: 1px solid #4e514e;
	 	border-radius: 100px 0px 100px 0px;
		margin:0px;
		padding:0px;
	}
	.gravebg {
		background-color: #fff;
		color: #000;
	}
	.fill{
		/*border: 1px solid #f9112c;*/
		background-color: #f66c7c;
		color: #fff;
	}
	.fill a{
		/*border: 1px solid #f9112c;*/ 
		color: #fff;
	}
 
.gray {  
  background: #778477;    
  /*border: 1px solid black; */
  
  }
  .gray a{
  	color: #fff;
  }

  .bgcolor_C {
  	background-color: #1d0df2;
  }

  .bgcolor_C > a{
  	color :#fff;
  }
 td > div {
 	font-size: 10px;
 	font-weight: bold;
 }
 p > table {
 	width: 100%;
 }
 .stretch img {
 	width: 100%;
 	height: 40px;
 }
</style>
<!-- margin: 10px 20px 30px 40px; is the same as margin-top: 10px; margin-right: 20px; margin-bottom: 30px; margin-left: 40px;, for example. -->
<?php 
  
function noDetailsGrave_vertical($start=0,$end=0,$width=0,$height=0,$section=""){
	global $mydb;
				echo '<table>';
				echo '<tr>';
			$graveno = $_GET['graveno'];  
				for ($i=$start; $i < $end ; $i++) { 
		        # code...
		    	$sql = "SELECT * FROM `tblpeople` WHERE `GRAVENO`='{$i}' AND CATEGORIES LIKE '%$section%'";
		    	$mydb->setQuery($sql);
		    	$cur = $mydb->executeQuery();
		    	$numrows  = $mydb->num_rows($cur);
		    	if ($numrows > 0) {
		    		# code...
		    	     $result = $mydb->loadSingleResult();
					$borndate =  ($result->BORNDATE !='0000-00-00') ? date_format(date_create($result->BORNDATE), "m/d/Y"): 'NONE';
					$dieddate =  ($result->DIEDDATE !='0000-00-00') ? date_format(date_create($result->DIEDDATE), "m/d/Y") : 'NONE';
		    	    $now = date("m/d/Y");
		    	     $age = date_diff(date_create($borndate),date_create($dieddate))->y;
		    	     $years = date_diff(date_create($dieddate),date_create($now))->y;


		    	     if ($years >= 5) {
		    	     	# code...
		    	     	$msg = "Test message";
		    	     }else{
		    	     	$msg="other test message";
		    	     }

		    	     $data_details='<p><table> 
									<tr >
										<td ><div>Name:</div></td>
										<td ><div>'.$result->NAME.'</div></td>
										<td ><div>Gender:</div></td>
										<td ><div>'.$result->SEX.'</div></td> 
									</tr>
									<tr>
										<td ><div>Age:</div></td>
										<td ><div>'.$age.'</div></td>
										<td ><div>Born:</div></td>
										<td ><div>'.$result->BORNDATE.'</div></td> 
									</tr>  
									<tr >
										<td ><div>Died:</div></td>
										<td ><div>'.$result->DIEDDATE.'</div></td> 
										<td ><div>Location:</div></td>
										<td ><div>'.$result->LOCATION.'</div></td>
									</tr>  

									<tr > 
										<td colspan=4 ><div class=stretch><img src='.web_root.'admin/person/'.$result->GRAVEPIC.'></div></td>  
									</tr> 
									<tr > 
										<td colspan=4 ><div>'.$msg.'</div></td>  
									</tr>   
							</table></p>';
		    	    

		    	     //  $display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
		                //                  <a href="#" data-toggle="tooltip" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" autofocus >'. $result->GRAVENO.'</a>
		                 //               </td>';

							$graveno = $_GET['graveno'];
							if ($graveno == $result->GRAVENO) {
							# code...
							$display_grave = '<td class="fill graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
									<a href="#" data-toggle="popover" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" autofocus >'.$result->GRAVENO.'</a>
							 	  </td>';
							}else{
							$display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
									<a href="#" data-toggle="tooltip" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" >'.$result->GRAVENO.'</a>
							 	  </td>';

							}


		    	}else{
		    		   $display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
		                                    <a href="#" data-toggle="tooltip" data-placement="bottom" data-content="none" title="Unoccupied Grave" autofocus >'. $i.'</a>
		                                  </td>';
		    	}

		    


		      

				echo '<tr>';
		        echo $display_grave;
				echo '</tr>';
		    }
		   
		echo '</table>';
}

function noDetailsGrave_horizontal($start=0,$end=0,$width=0,$height=0,$section=""){
	global $mydb;
		echo '<table>';
				echo '<tr>';
		    $graveno = $_GET['graveno'];  
		    for ($i=$start; $i < $end ; $i++) { 
		        # code...
		    	$sql = "SELECT * FROM `tblpeople` WHERE `GRAVENO`='{$i}' AND CATEGORIES Like '%$section%'";
		    	$mydb->setQuery($sql);
		    	$cur = $mydb->executeQuery();
		    	$numrows  = $mydb->num_rows($cur);
		    	if ($numrows > 0) {
		    		# code...
		    	     $result = $mydb->loadSingleResult();
					$borndate =  ($result->BORNDATE !='0000-00-00') ? date_format(date_create($result->BORNDATE), "m/d/Y"): 'NONE';
					$dieddate =  ($result->DIEDDATE !='0000-00-00') ? date_format(date_create($result->DIEDDATE), "m/d/Y") : 'NONE';
					$now = date("m/d/Y");
		    	     $age = date_diff(date_create($borndate),date_create($dieddate))->y;
		    	     $years = date_diff(date_create($dieddate),date_create($now))->y;


		    	     if ($years >= 5) {
		    	     	# code...
		    	     	$msg = "Test message 2";
		    	     }else{
		    	     	$msg="Other test message 2";
		    	     }

		    	     $data_details='<p><table> 
									<tr >
										<td ><div>Name:</div></td>
										<td ><div>'.$result->NAME.'</div></td>
										<td ><div>Gender:</div></td>
										<td ><div>'.$result->SEX.'</div></td> 
									</tr>
									<tr>
										<td ><div>Age:</div></td>
										<td ><div>'.$age.'</div></td>
										<td ><div>Born:</div></td>
										<td ><div>'.$result->BORNDATE.'</div></td> 
									</tr>  
									<tr >
										<td ><div>Died:</div></td>
										<td ><div>'.$result->DIEDDATE.'</div></td> 
										<td ><div>Location:</div></td>
										<td ><div>'.$result->LOCATION.'</div></td>
									</tr>  

									<tr > 
										<td colspan=4 ><div class=stretch><img src='.web_root.'admin/person/'.$result->GRAVEPIC.'></div></td>  
									</tr> 
									<tr > 
										<td colspan=4 ><div>'.$msg.'</div></td>  
									</tr>   
							</table></p>';
		    	    

		    	           //  $display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
		                     //            <a href="#" data-toggle="tooltip" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" autofocus >'. $result->GRAVENO.'</a>
		                      //          </td>';

							$graveno = $_GET['graveno'];
							if ($graveno == $result->GRAVENO) {
							# code...
							$display_grave = '<td class="fill graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
									<a href="#" data-toggle="popover" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" autofocus >'.$result->GRAVENO.'</a>
							 	  </td>';
							}else{
							$display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
									<a href="#" data-toggle="tooltip" data-placement="bottom" data-content="'.$data_details.'" title="Grave of &nbsp;'.$result->NAME.'" >'.$result->GRAVENO.'</a>
							 	  </td>';

							}


		    	}else{
		    		   $display_grave = '<td class="graveborder gravebg" style="width:'.$width.'px;height:'.$height.'px;">
		                                    <a href="#" data-toggle="tooltip" data-placement="bottom" data-content="none" title="Unoccupied Grave" >'. $i.'</a>
		                                  </td>';
		    	}

		    


		      

		        echo $display_grave;
		    }
		   
				echo '</tr>';
		echo '</table>';
}

?> 



