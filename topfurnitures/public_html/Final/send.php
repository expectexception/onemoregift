<?php

$name=$_POST['name'];

$email=$_POST['email'];





$query=$_POST['query'];



$string= $name."\n ".$email." \n".$address    ;


$headers = "From:info@topfurnitures.in";
$headers .= "\r\nReply-To:  info@topfurnitures.in";
$headers .= "\r\nX-Mailer: PHP/".phpversion();





mail("info@topfurnitures.in","Query - Contact Us Page",$string,$headers);



echo "<script>alert('Request sent successfully');</script>";

echo '<META HTTP-EQUIV="Refresh" Content="0; URL=http://www.topfurnitures.in">';

exit;

?>