<?php
   if (!isset($_SESSION['USERID'])){
      redirect(web_root."index.php");
     }

      // $autonum = New Autonumber();
      // $result = $autonum->single_autonumber(4);

?> 
 <form class="form-horizontal span6" action="controller.php?action=add" method="POST" enctype="multipart/form-data"    >
 <div class="row">
         <div class="col-lg-12">
            <h1 class="page-header">Add New Deceased Person</h1>
          </div>
          <!-- /.col-lg-12 -->
       </div> 
          <?php   check_message();  ?>  
                   <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "GRAVENO">Grave Number:</label>

                      <div class="col-md-8">
                            <input class="form-control input-sm" id="GRAVENO" name="GRAVENO" placeholder=
                            "Grave Number" type="text" value="">
                      </div>
                    </div>
                  </div> 

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "NAME">Full Name:</label>

                      <div class="col-md-8">
                            <input class="form-control input-sm" id="NAME" name="NAME" placeholder=
                            "Full Name" type="text" value="">
                      </div>
                    </div>
                  </div> 


                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "SEX">Gender:</label>

                      <div class="col-md-8">
                          <select name="SEX" id="SEX" class="form-control input-sm">
                            <option> Male </option>
                            <option> Female </option> 
                            <option> Unknown</option> 
                         </select>
                      </div>
                    </div>
                  </div>

              <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "BORNDATE">Born:</label>

                      <div class="col-md-8">
                       <div class="input-group" id=""> 
                          <div class="input-group-addon"> 
                            <i class="fa fa-calendar"></i>
                          </div>
                          <input id="datemask2" name="BORNDATE"  value="" type="text" class="form-control input-sm datemask2"   data-inputmask="'alias': 'mm/dd/yyyy'" data-mask >
                        </div>
                      </div>
                    </div>
                  </div>

                   <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "DIEDDATE">Died:</label>

                      <div class="col-md-8">
                       <div class="input-group" id=""> 
                          <div class="input-group-addon"> 
                            <i class="fa fa-calendar"></i>
                          </div>
                          <input id="datemask2" name="DIEDDATE"  value="" type="text" class="form-control input-sm datemask2"   data-inputmask="'alias': 'mm/dd/yyyy'" data-mask >
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "CATEGORIES">Grave Type:</label>

                      <div class="col-md-8">
                       <select class="form-control input-sm" name="CATEGORIES" id="CATEGORIES">
                          <option value="None">Select Grave Type</option>

                            <?php
                            //Statement
 

                           $mydb->setQuery("SELECT * FROM `tblcategory` where CATEGORIES = '".$p->CATEGORIES."'");
                          $cur = $mydb->loadResultList();
                        foreach ($cur as $result) {
                          echo  '<option SELECTED  value='.$result->CATEGORIES.' >'.$result->CATEGORIES.'</option>';
                          }


                          $mydb->setQuery("SELECT * FROM `tblcategory` where CATEGORIES != '".$p->CATEGORIES."'");
                          $cur = $mydb->loadResultList();
                        foreach ($cur as $result) {
                          echo  '<option  value='.$result->CATEGORIES.' >'.$result->CATEGORIES.'</option>';
                          }
                          ?>
                         
          
                        </select> 
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "LOCATION"> Burial Location:</label> 
                      <div class="col-md-8">
                             
                      <select class="form-control input-sm" name="LOCATION" id="LOCATION">
                          <option>Hai Naivasha - Christian Cemetery</option>
                          <option>Hai Naivasha - Muslim Cemetery (Gumbo)</option>
          
                        </select> 
                      </div>
                    </div>
                  </div> 

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "MEMORABILIA">Msg on Tombstone:</label>

                      <div class="col-md-8">
                            <textarea name="MEMORABILIA" id="MEMORABILIA" class="form-control input-sm" placeholder="Tombstone Msg"></textarea>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "BURIALTYPE">Comments on Burial:</label>
                      <div class="col-md-8">
                            <textarea name="BURIALTYPE" id="BURIALTYPE" class="form-control input-sm" placeholder="About the burial"></textarea>
                      </div>
                      </div>
                    </div>
                  </div>

                    <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4" style="text-align: right;" for="personImage">Person Image:</label>
                      <div class="col-md-8">
                      <input type="file" name="personImage" value="" id="personImage"/>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4" style="text-align: right;" for="graveImage">Grave Image:</label>
                      <div class="col-md-8">
                      <input type="file" name="graveImage" value="" id="graveImage"/>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4" style="text-align: right;" for="graveImage">Attachment FIle:</label>
                      <div class="col-md-8">
                      <input type="file" name="attachmentfile" value="" id="attachmentfile"/>
                      </div>
                    </div>
                  </div>





                  
             <div class="form-group">
                    <div class="col-md-8">
                      <label class="col-md-4 control-label" for=
                      "idno"></label>

                      <div class="col-md-8">
                        <button class="btn  btn-primary btn-sm" name="save" type="submit" ><span class="fa fa-save fw-fa"></span> Save</button>
                      </div>
                    </div>
                  </div>
       
          
        </form>
      

       