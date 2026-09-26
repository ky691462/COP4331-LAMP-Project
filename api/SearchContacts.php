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

$search = $_GET["search"];
$userId = $_SESSION["userId"];

$conn = new mysqli(
	"localhost",
	"LampProjectUser",
	"database_pw",
	"LampProjectDB"
);

if ($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	$searchTerm = "%" . $search . "%";

	$stmt = $conn->prepare(
		"SELECT ID, FirstName, LastName, Email, Phone, Address
		FROM Contacts
		WHERE UserID = ?
		AND (
			FirstName LIKE ?
			OR LastName LIKE ?
			OR Email LIKE ?
			OR Phone LIKE ?
			OR Address LIKE ?
		)"
	);

	$stmt->bind_param(
		"isssss",
		$userId,
		$searchTerm,
		$searchTerm,
		$searchTerm,
		$searchTerm,
		$searchTerm
	);

	$stmt->execute();
	$result = $stmt->get_result();
	$contacts = array();

	while($row = $result->fetch_assoc()){
		$contacts[] = array(
			"id" => $row["ID"],
			"firstName" => $row["FirstName"],
			"lastName" => $row["LastName"],
			"email" => $row["Email"],
			"phone" => $row["Phone"],
			"address" => $row["Address"]
		);
	}

	returnWithInfo($contacts);
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
	$retValue = array(
		"results" => array(),
		"error" => $err
	);
	sendResultInfoAsJson(json_encode($retValue));
}

function returnWithInfo($contacts){
	$retValue = array(
		"results" => $contacts,
		"error" => ""
	);
	sendResultInfoAsJson(json_encode($retValue));
}

?>
