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
$firstName = $inData["firstName"];
$lastName = $inData["lastName"];
$email = $inData["email"];
$phone = $inData["phone"];
$address = $inData["address"];
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
	// Check if same email or phone exits on another contact
	$stmt = $conn->prepare(
		"SELECT ID
		FROM Contacts
		WHERE UserId = ?
		AND ID != ?
		AND (Email = ? OR Phone = ?)"
	);

	$stmt->bind_param(
		"iiss",
		$userId,
		$id,
		$email,
		$phone
	);

	$stmt->execute();
	$result = $stmt->get_result();

	if($result->num_rows > 0){
		returnWithError("Another contact exists with this phone number or email");
	}else{
		$stmt->close();

		$stmt = $conn->prepare(
			"UPDATE Contacts
			SET FirstName = ?, LastName = ?, Email = ?, Phone = ?, Address = ?
			WHERE ID = ? AND UserId = ?"
		);

		$stmt->bind_param(
			"sssssii",
			$firstName,
			$lastName,
			$email,
			$phone,
			$address,
			$id,
			$userId
		);

		$stmt->execute();

		if ($stmt->affected_rows > 0){
			returnWithInfo();
		}else{
			returnWithError("Contact not found / no changes made");
		}
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
