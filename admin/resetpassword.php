<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>Majestic Admin</title>
  <!-- plugins:css -->
  <link rel="stylesheet" href="pretty/vendors/mdi/css/materialdesignicons.min.css">
  <link rel="stylesheet" href="pretty/vendors/base/vendor.bundle.base.css">
  <!-- endinject -->
  <!-- plugin css for this page -->
  <!-- End plugin css for this page -->
  <!-- inject:css -->
  <link rel="stylesheet" href="pretty/css/style.css">
  <!-- endinject -->
  <link rel="shortcut icon" href="../images/logo1.png" />
</head>

<?php
require_once("../include/initialize.php");



 ?>
<?php if (!isset($_POST['email'])) { ?>
<body>
  <div class="container-scroller">
    <div class="container-fluid page-body-wrapper full-page-wrapper">
      <div class="content-wrapper d-flex align-items-stretch auth auth-img-bg">
        <div class="row flex-grow">
          <div class="col-lg-6 d-flex align-items-center justify-content-center">
            <div class="auth-form-transparent text-left p-3">
              <div class="brand-logo">
                  <img src="../images/logo3.png" alt="logo">
              </div>
              <h4>Forgot Password?</h4>
              <h6 class="font-weight-light">Reset it here! It takes only one few</h6>
              <form class="pt-3" id="register-form" role="form" autocomplete="off" class="form" method="post" action="">
               
                
             

                <div class="form-group">
                  <label>Email</label>
                  <div class="input-group">
                    <div class="input-group-prepend bg-transparent">
                      <span class="input-group-text bg-transparent border-right-0">
                        <i class="mdi mdi-email-outline text-primary"></i>
                      </span>
                    </div>
                    <input id="email" name="email" placeholder="Username" class="form-control"  type="text" class="form-control form-control-lg border-left-0">
                  </div>
                </div>
                
                <div class="mb-4">
                  <div class="form-check">
                    <label class="form-check-label text-muted">
                      <input type="checkbox" class="form-check-input" required>
                      I confirm this as my correct email / username
                    </label>
                  </div>
                </div>
                <div class="mt-3">
                  <button name="recover-submit" class="btn btn-block btn-primary btn-lg font-weight-medium value="Reset Password" type="submit" " >RECOVER ACCOUNT</button>
                </div>
                <div class="text-center mt-4 font-weight-light">
                  Already have an account? <a href="<?php echo web_root; ?>admin/login.php" class="text-primary">Login</a>
                </div>
              </form>
            </div>
          </div>
          <div class="col-lg-6 register-half-bg d-flex flex-row">
            <p class="text-white font-weight-medium text-center flex-grow align-self-end">Copyright &copy; 2020  All rights reserved. <br> <span><a href="" target="_blank">XaLabs03 Creative Studios</a> | Oriba Douglas</span></p>
          </div>
        </div>
      </div>
      <!-- content-wrapper ends -->
    </div>
    <!-- page-body-wrapper ends -->
  </div>

  <?php
 }else{ 

  $sql = "SELECT * FROM `tbluseraccount` WHERE `U_USERNAME`='{$_POST['email']}'";
  $mydb->setQuery($sql);
  $res = $mydb->executeQuery();
  $maxrow = $mydb->num_rows($res);

  if ($maxrow>0) {
?> 

<div class="col-md-6 col-md-offset-6">
      <form class="" method="POST" action="<?php echo web_root; ?>admin/success.php" onsubmit="return validate()">
    <div class="modal-header">
      <label id="errormsg" class="label label-danger col-md-4"></label>
        <h3>Change Password <span class="extra-title muted"></span></h3>
    </div>
    <div class="modal-body form-horizontal"> 
        <div class="control-group">
            <label for="new_password" class="control-label">New Password</label>
            <div class="controls">
                <input class="form-control" id="new_password" name="new_password" type="password">
            </div>
        </div>
        <div class="control-group">
            <label for="confirm_password" class="control-label">Confirm Password</label>
            <div class="controls">
                <input class="form-control" id="confirm_password" name="confirm_password" type="password">
            </div>
        </div>      
    </div>
    <div class="modal-footer">
      <input type="hidden" class="hide" name="token" value="<?php echo $_POST['email'];?>">
        <a href="<?php echo web_root; ?>admin/login.php" class="btn btn-default"  >Login</a>
        <button  type="submit" class="btn btn-primary" name="submit" >Save changes</button>
    </div>
  </form>
</div>

<?php  }else{

?>
<div class="container">
  <div class="row">
    <div class="col-md-6 col-md-offset-6">
            <div class="panel panel-default">
              <div class="panel-body">
                <div class="text-center">
                  <h3><i class="fa fa-lock fa-4x"></i></h3>
                  <label class="label col-md-12 label-danger text-center">Can't find username!</label>
                  <h2 class="text-center">Forgot Password?</h2>
                  <p>You can reset your password here.</p>
                  <div class="panel-body">
    
                    <form id="register-form" role="form" autocomplete="off" class="form" method="POST" action="">
    
                      <div class="form-group">
                        <div class="input-group">
                          <span class="input-group-addon"><i class="glyphicon glyphicon-user color-blue"></i></span>
                          <input id="email" name="email" placeholder="Username" class="form-control"  type="text">
                        </div>
                      </div>
                      <div class="form-group">
                        <button name="recover-submit" class="btn btn-lg btn-primary btn-block"  type="submit">Reset Password</button>
                      </div> 
                    </form>
    
                  </div>
                </div>
              </div>
            </div>
          </div>
  </div>
</div>

<?php  }


}
  ?>

  <script type="text/javascript">
    function validate() {
 
      var newpass;
      var confirmpass;

      newpass = $("#new_password").val();
      confirmpass = $("#confirm_password").val(); 


      if (newpass==confirmpass) {
         $("#errormsg").hide();
         return true;

      }else{
          $("#errormsg").hide();
          $("#errormsg").fadeIn();
          $("#errormsg").html("Password does not match!");
          return false;
      }
    }
  </script>

  <!-- container-scroller -->
  <!-- plugins:js -->
  <script src="pretty/vendors/base/vendor.bundle.base.js"></script>
  <!-- endinject -->
  <!-- inject:js -->
  <script src="pretty/js/off-canvas.js"></script>
  <script src="pretty/js/hoverable-collapse.js"></script>
  <script src="pretty/js/template.js"></script>
  <!-- endinject -->
</body>

</html>
