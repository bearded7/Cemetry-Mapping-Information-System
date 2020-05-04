<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Admin Login | Cemetery Mapping & information System</title>
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
  <?php
 // login confirmation
  if(isset($_SESSION['USERID'])){
    redirect(web_root."admin/index.php");
  }
  ?>

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
                            <h4>Welcome back!</h4>
                            <h6 class="font-weight-light">Happy to see you again!</h6>
                            <section class="login-form">
                            <form class="pt-3" method="post" action="" role="login">
                                <div class="form-group">
                                <?php echo check_message(); ?>
                                    <label for="exampleInputEmail">Username</label>
                                    <div class="input-group">
                                        <div class="input-group-prepend bg-transparent">
                                            <span class="input-group-text bg-transparent border-right-0">
                        <i class="mdi mdi-account-outline text-primary"></i>
                      </span>
                                        </div>
                                        <input type="input" name="user_email" placeholder="Username" required class="form-control input-lg" value="">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="exampleInputPassword">Password</label>
                                    <div class="input-group">
                                        <div class="input-group-prepend bg-transparent">
                                            <span class="input-group-text bg-transparent border-right-0">
                        <i class="mdi mdi-lock-outline text-primary"></i>
                      </span>
                                        </div>
                                        <input type="password" name="user_pass" class="form-control input-lg" id="password" placeholder="Password" required>
                                    </div>
                                </div>
                                <div class="my-2 d-flex justify-content-between align-items-center">

                                    <a href="resetpassword.php" class="auth-link text-black">Forgot password?</a>
                                </div>
                                <div class="my-3">
                                    <button type="submit" name="btnLogin" class="btn btn-block btn-primary btn-lg font-weight-medium " >LOGIN</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="col-lg-6 login-half-bg d-flex flex-row">
                    <p class="text-white font-weight-medium text-center flex-grow align-self-end">Copyright &copy; 2020  All rights reserved. <br> <span><a href="" target="_blank">XaLabs03 Creative Studios</a> | Oriba Douglas</span></p>
                    </div>
                </div>
            </div>
            <!-- content-wrapper ends -->
        </div>
        <!-- page-body-wrapper ends -->
    </div>
    <!-- container-scroller -->
    <!-- plugins:js -->
    <script src="pretty/vendors/base/vendor.bundle.base.js"></script>
    <!-- endinject -->
    <!-- inject:js -->
    <script src="pretty/js/off-canvas.js"></script>
    <script src="pretty/js/hoverable-collapse.js"></script>
    <script src="pretty/js/template.js"></script>
    <!-- endinject -->

    <?php 

if(isset($_POST['btnLogin'])){
  $email = trim($_POST['user_email']);
  $upass  = trim($_POST['user_pass']);
  $h_upass = sha1($upass);
  
   if ($email == '' OR $upass == '') {

      message("Invalid Username and Password!", "error");
      redirect("login.php");
         
    } else {  
  //it creates a new objects of member
    $user = new User();
    //make use of the static function, and we passed to parameters
    $res = $user::userAuthentication($email, $h_upass);
    if ($res==true) { 
       message("You logon as ".$_SESSION['U_ROLE'].".","success");
      if ($_SESSION['U_ROLE']=='Administrator'){
         redirect(web_root."admin/index.php");
      }else{
           redirect(web_root."admin/login.php");
      }
    }else{
      message("Account does not exist! Please contact Administrator.", "error");
       redirect(web_root."admin/login.php"); 
    }
 }
 } 
 ?> 

</body>

</html>