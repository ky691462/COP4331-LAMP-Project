<?php

session_start();
if(!isset($_SESSION["userId"]) || !isset($_SESSION["lastActivity"])){
        returnWithError("Not logged in");
        exit();
}

if (time() - $_SESSION["lastActivity"] > 1800){
        session_unset();
        session_destroy();
        returnWithError("Session expired");
        exit();
}

$_SESSION["lastActivity"] = time();

if(!isset($_SESSION["isAdmin"]) || $_SESSION["isAdmin"] != 1){
	returnWithError("Unauthorized");
	exit();
}

$inData = getRequestInfo();
$userId = $inData["userId"];
$isAdmin = $inData["isAdmin"];

if ($userId == $_SESSION["userId"]){
	returnWithError("Cannot change your own role");
	exit();
}
if($isAdmin != 0 && $isAdmin != 1){
	returnWithError("Invalid admin status");
	exit();
}

$conn = new mysqli(
	"localhost",
	"LampProjectUser",
	"database_pw",
	"LampProjectDB"
);

if($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	$stmt = $conn->prepare(
		"UPDATE Users
		SET IsAdmin = ?
		WHERE ID = ?"
	);
	$stmt->bind_param(
		"ii",
		$isAdmin,
		$userId
	);
	$stmt->execute();
	if($stmt->affected_rows > 0){
		returnWithError("");
	}else{
		returnWithError("User not found or role already set");
	}

	$stmt->close();
	$conn->close();
}

function getRequestInfo(){
	return json_decode(file_get_contents("php://input"), true);
}

function sendResultInfoAsJson($obj){
	header("Content-type: application/json");
	echo $obj;
}

function returnWithError($err){
	$retValue =
		'{"error":"' .
		$err .
		'"}';
	sendResultInfoAsJson(json_encode($retValue));
}

?>
