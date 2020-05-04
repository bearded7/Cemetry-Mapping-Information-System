<!DOCTYPE html>
<html lang="en">
<head>
<title><?php echo $title; ?> | Cemetery Mapping and Information System</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Your description">
<meta name="keywords" content="Your keywords">
<meta name="author" content="Your name">
<link rel="icon" href="images/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon" />

<link rel="stylesheet" href="css/bootstrap.css" type="text/css" media="screen">
<link rel="stylesheet" href="css/bootstrap-responsive.css" type="text/css" media="screen">    
<link rel="stylesheet" href="css/style.css" type="text/css" media="screen">

<script type="text/javascript" src="js/jquery.js"></script>  
<script type="text/javascript" src="js/jquery.easing.1.3.js"></script>
<script type="text/javascript" src="js/superfish.js"></script>

<script type="text/javascript" src="js/jquery.ui.totop.js"></script>

<script type="text/javascript" src="js/cform.js"></script>

<script type="text/javascript" src="js/script.js"></script>
<script>
$(document).ready(function() {
	//
	

	



}); //
$(window).load(function() {
	//

}); //
</script>		
<!--[if lt IE 8]>
		<div style='text-align:center'><a href="http://www.microsoft.com/windows/internet-explorer/default.aspx?ocid=ie6_countdown_bannercode"><img src="http://www.theie6countdown.com/images/upgrade.jpg"border="0"alt=""/></a></div>  
	<![endif]-->    

<!--[if lt IE 9]>
  <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>      
  <link rel="stylesheet" href="css/ie.css" type="text/css" media="screen">
<![endif]-->
</head>

<?php
if (isset($_SESSION['gcCart'])){
  if (count($_SESSION['gcCart'])>0) {
    $cart = '<label class="label label-danger">'.count($_SESSION['gcCart']) .'</label>';
  } 
 
} 
 ?>

<body class="not-front">
<div id="main">

<div class="top1_wrapper">
<div class="top1 clearfix">
	
<header><div class="logo_wrapper"><a href="index.php" class="logo"><img src="images/logo.png" alt=""></a></div></header>

<div class="menu_wrapper clearfix">
<div class="navbar navbar_">
	<div class="navbar-inner navbar-inner_">
		<a class="btn btn-navbar btn-navbar_" data-toggle="collapse" data-target=".nav-collapse_">
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		</a>
		<div class="nav-collapse nav-collapse_ collapse">
			<ul class="nav sf-menu clearfix">
                        <li class="upper-links <?php echo ($_GET['q']=='') ? "active" : false;?>"><a class="links" href="<?php echo web_root.'index.php'; ?>">Home</a></li>
                        <li class="upper-links <?php echo ($_GET['q']=='person') ? "active" : false;?>"><a class="links" href="<?php echo web_root.'index.php?q=person'; ?>">Burial Records</a></li>
                        <li class="upper-links <?php echo ($_GET['q']=='contacts') ? "active" : false;?>"><a class="links" href="<?php echo web_root.'index.php?q=contacts';  ?>">Contact Us</a></li>
                        <!-- <li class="upper-links <?php echo ($_GET['q']=='about') ? "active" : false;?>"><a class="links" href="<?php echo web_root.'index.php?q=about';  ?>">About Us</a></li> -->										
    </ul>
		</div>
	</div>
</div>
<div id="search">
	
<a href="#" class="searchBtn"></a>

<div class="search-form-wrapper">
<form id="search-form" action="index.php?q=person" method="POST" accept-charset="utf-8" class="navbar-form" >
                    <input type="" placeholder="Search for Grave No, Name" name="search">
                            <path d="M11.618 9.897l4.224 4.212c.092.09.1.23.02.312l-1.464 1.46c-.08.08-.222.072-.314-.02L9.868 11.66M6.486 10.9c-2.42 0-4.38-1.955-4.38-4.367 0-2.413 1.96-4.37 4.38-4.37s4.38 1.957 4.38 4.37c0 2.412-1.96 4.368-4.38 4.368m0-10.834C2.904.066 0 2.96 0 6.533 0 10.105 2.904 13 6.486 13s6.487-2.895 6.487-6.467c0-3.572-2.905-6.467-6.487-6.467 "></path>
                        </svg>
</form>	
</div>

</div>	
</div>

</div>	
</div>

<div id="inner">

<div class="top2_wrapper">
<div class="bg1"><img src="images/bg1.jpg" alt="" class="img"></div>
<div class="top2_inner">
<div class="container">
<div class="top2 clearfix">
	
<h1>contact us</h1>

<div class="breadcrumbs1"><a href="index.php">Home</a><span></span><a href="index.php">Pages</a><span></span>Contacts</div>


</div>	
</div>	
</div>
</div>


<?php
if (isset($_GET['category'])) {
  # code...
   $categid = isset($_GET['category']) ? $_GET['category'] : ''; 
  $sql="SELECT * FROM `tbltype` WHERE `TYPEID`=".$categid;
  $mydb->setQuery($sql);
  $cur = $mydb->loadSingleResult();
}
 

?>
   <?php if (!isset($_GET['graveno'])): ?> 
              
            <div  style="background-color:#fff;padding:20px 5px">
              
                    <?php require_once $content; ?> 
                 
            </div>   
         <?php endif ?>
        <?php if (isset($_GET['graveno'])): ?>
          
       

                  <b>Map Section | <a  href="#" class="findgrave" style="color: red"><?php   
                       echo   (isset($_GET['name']) ?  $_GET['name'] : '' )?></a></b> 
                  </div>
                </div>
     
                 <?php 
                    require_once "map.php"; 
                  ?>
                </div>
              </div>
             </div> 
          <?php endif ?> 
       </div>
             

  </div> 



<div class="bot1_wrapper">
<div class="container">
<div class="bot1 clearfix">
<div class="row">
<div class="span3">

<div class="bot1_title">Copyright</div>	
	
<div class="logo2_wrapper"><a href="index.html" class="logo2"><img src="images/logo2.png" alt=""></a></div>

	<footer><div class="copyright">Copyright © 2017 <br>All rights reserved. Created by <a href="https://gridgum.com">Gridgum</a></div></footer>

</div>	
<div class="span5">

<div class="bot1_title">Useful information</div>

<p>
	<b>
		Nulla ultricies enim aliquet augue eleifend iaculis.
	</b>
</p>

<p>
	Nam sollicitudin ligula ac nisi iaculis eu scelerisque risus ultricies. Nullam eu elit risus, vel interdum urna. Aenean leo nulla, aliquet vitae ultricies sit amet, porttitor id sapien. In hac habitasse platea dictumst. Donec pharetra gravida augue at hendrerit. Cras ut...
</p>

</div>
<div class="span3 offset1">

<div class="bot1_title">Follow Us</div>
	
<div class="social_wrapper">
	<ul class="social clearfix">    
    <li><a href="#"><img src="images/social_ic1.png"></a></li>
    <li><a href="#"><img src="images/social_ic2.png"></a></li>
    <li><a href="#"><img src="images/social_ic3.png"></a></li>
    <li><a href="#"><img src="images/social_ic4.png"></a></li>
    <li><a href="#"><img src="images/social_ic5.png"></a></li>
    <li><a href="#"><img src="images/social_ic6.png"></a></li>
	</ul>
</div>

</div>
</div>	
</div>	
</div>	
</div>

</div>	
</div>
<script type="text/javascript" src="js/bootstrap.js"></script>
</body>
</html>