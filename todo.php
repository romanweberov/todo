<?php
header('Content-Type: application/json');
if(!$_POST['json']){
	$fh = fopen("todo.txt", "r+");
	if($fh){
		$json = fgets($fh);
	} else {
		$json = 'nofile';
	}
	fclose($fh);
	echo $json;
} else {
	$json = $_POST['json'];
	echo $json;
	@unlink("todo.txt");
	$fh = fopen("todo.txt", "w");
	fwrite($fh, $json);
	fclose($fh);
}
?>