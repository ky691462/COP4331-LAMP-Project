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

$firstName = $inData["firstName"];
$lastName = $inData["lastName"];
$login = $inData["login"];
$password = $inData["password"];
$isAdmin = $inData["isAdmin"];

if($isAdmin != 0 && $isAdmin != 1){
	returnWithError("Invalid admin status");
	exit();
}

if (strlen($password) < 8){
	returnWithError("Password must be at least 8 characters");
	exit();
}
if (!preg_match('/[A-Z]/', $password)){
	returnWithError("Password must have at least one uppercase letter");
	exit();
}
if(!preg_match('/[0-9]/', $password)){
	returnWithError("Password must have at least one number");
	exit();
}
if(!preg_match('/[^a-zA-Z0-9]/', $password)){
	returnWithError("Password must have at least one special character");
	exit();
}
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

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
		"SELECT ID
		FROM Users
		WHERE Login = ?"
	);
	$stmt->bind_param(
		"s",
		$login
	);
	$stmt->execute();
	$result = $stmt->get_result();

	if($result->num_rows > 0){
		returnWithError("Login already exists");
		$stmt->close();
		$conn->close();
		exit();
	}
	$stmt->close();

	$stmt = $conn->prepare(
		"INSERT INTO Users (FirstName, LastName, Login, Password, IsAdmin, IsSuspended)
		VALUES (?, ?, ?, ?, ?, 0)"
	);
	$stmt->bind_param(
		"ssssi",
		$firstName,
		$lastName,
		$login,
		$hashedPassword,
		$isAdmin
	);
	$stmt->execute();
	if($stmt->affected_rows > 0){
		returnWithError("");
	}else{
		returnWithError("Could not create user");
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
