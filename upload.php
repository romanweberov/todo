<?php

	function exit_status($str){
	    echo json_encode(array('status'=>$str));
	    exit;
	}
	
	function get_extension($file_name){
	    $ext = explode('.', $file_name);
	    $ext = array_pop($ext);
	    return strtolower($ext);
	}

	$upload_dir = 'upload/'; //Создадим папку для хранения изображений

	
	if(strtolower($_SERVER['REQUEST_METHOD']) != 'post'){
	    exit_status('Ошибка при отправке запроса на сервер!');
	} else {
		$uploads_dir = 'upload';
        $tmp_name = $_FILES["thefile"]["tmp_name"];
        $name = $_FILES["thefile"]["name"];
        move_uploaded_file($tmp_name, "$uploads_dir/$name");

		exit_status($_FILES);
	}

?>