<?php
require_once("../include/initialize.php");

$sql = "UPDATE `tbluseraccount` SET `U_PASS`=sha1('".$_POST['new_password']."') WHERE `U_USERNAME`='".$_POST['token']."'";
$mydb->setQuery($sql);
$res = $mydb->executeQuery();

 ?>
<link href="<?php echo web_root; ?>css/bootstrap.min.css" rel="stylesheet">

<div class="container" style="margin-top: 50px">
    <div class="alert alert-success fade in"> 
        <strong>Success!</strong> Password has been changed. <a href="login.php">Click here to Login</a>
    </div>
  </div>