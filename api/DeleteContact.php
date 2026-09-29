<?php

session_start();
$inData = getRequestInfo();
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

$id = $inData["id"];
$userId = $_SESSION["userId"];

$conn = new mysqli(
	"localhost",
	"LampProjectUser",
	"COP4331!",
	"LampProjectDB"
);

if($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	$stmt = $conn->prepare(
		"DELETE FROM Contacts
		WHERE ID = ? AND UserID = ?"
	);

	$stmt->bind_param(
		"ii",
		$id,
		$userId
	);

	$stmt->execute();

	if($stmt->affected_rows > 0){
		returnWithInfo();
	}else{
		returnWithError("Contact not found");
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
	sendResultInfoAsJson($retValue);
}

function returnWithInfo(){
	$retValue = '{"error":""}';
	sendResultInfoAsJson($retValue);
}

?>
