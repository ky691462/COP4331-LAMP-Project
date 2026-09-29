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

$userId = $_SESSION["userId"];

$firstName = $inData["firstName"];
$lastName = $inData["lastName"];
$email = $inData["email"];
$phone = $inData["phone"];
$address = $inData["address"];

$conn = new mysqli(
	"localhost",
	"LampProjectUser",
	"COP4331!",
	"LampProjectDB"
);

if ($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	// Check if contact already exists for user (same email/phone)
	$stmt = $conn->prepare(
		"SELECT ID
		FROM Contacts
		WHERE UserID = ?
		AND (Email = ? OR phone = ?)"
	);

	$stmt->bind_param(
		"iss",
		$userId,
		$email,
		$phone
	);

	$stmt->execute();
	$result = $stmt->get_result();

	if ($result->num_rows > 0){
		returnWithError("Contact already exists");
	} else {
		$stmt->close();

		$stmt = $conn->prepare(
			"INSERT INTO Contacts
        		(FirstName, LastName, Email, Phone, Address, UserID)
        		VALUES (?, ?, ?, ?, ?, ?)"
    		);

    		$stmt->bind_param(
        		"sssssi",
        		$firstName,
        		$lastName,
        		$email,
        		$phone,
        		$address,
        		$userId
    		);

    		if ($stmt->execute()){
        		$contactId = $conn->insert_id;
        		returnWithInfo($contactId);
    		}else{
        		returnWithError($stmt->error);
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
        	'{"id":0,"error":"' .
        	$err .
        	'"}';

    	sendResultInfoAsJson($retValue);
}

function returnWithInfo($id){
    	$retValue =
        	'{"id":' .
        	$id .
        	',"error":""}';

    	sendResultInfoAsJson($retValue);
}

?>
