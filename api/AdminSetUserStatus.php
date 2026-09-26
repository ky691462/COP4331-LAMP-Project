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
$isSuspended = $inData["isSuspended"];

if ($userId == $_SESSION["userId"]){
	returnWithError("Cannot change your own status");
	exit();
}

if($isSuspended != 0 && $isSuspended != 1){
	returnWithError("Invalid status");
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
		SET IsSuspended = ?
		WHERE ID = ?"
	);

	$stmt->bind_param(
		"ii",
		$isSuspended,
		$userId
	);
	$stmt->execute();

	if($stmt->affected_rows > 0){
		returnWithError("");
	}else{
		returnWithError("User not found or status already set");
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

