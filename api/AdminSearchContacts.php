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

$search = $_GET["search"] ?? "";
$conn = new mysqli(
	"localhost",
	"LampProjectUser",
	"COP4331!",
	"LampProjectDB"
);

if($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	$searchTerm = "%" . $search . "%";
	$stmt = $conn->prepare(
		"SELECT c.ID, c.FirstName, c.LastName, c.Email, c.Phone, c.Address, c.UserID, u.Login
		FROM Contacts c
		JOIN Users u ON c.UserID = u.ID
		WHERE c.FirstName LIKE ?
		OR c.LastName LIKE ?
		OR c.Email LIKE ?
		OR c.Phone LIKE ?
		OR c.Address LIKE ?
		OR u.Login LIKE ?
		ORDER BY c.ID"
	);

	$stmt->bind_param(
		"ssssss",
		$searchTerm,
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
			"address" => $row["Address"],
			"userId" => $row["UserID"],
			"ownerLogin" => $row["Login"]
		);
	}

	returnWithInfo($contacts);
	$stmt->close();
	$conn->close();
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
	$retValue = array (
		"results" => $contacts,
		"error" => ""
	);
	sendResultInfoAsJson(json_encode($retValue));
}

?>
