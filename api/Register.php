<?php

$inData = getRequestInfo();

$firstName = $inData["firstName"];
$lastName = $inData["lastName"];
$login = $inData["login"];
$password = $inData["password"];

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


if ($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	// Check if login exists
	$stmt = $conn->prepare(
		"SELECT ID FROM Users WHERE Login=?"
	);

	$stmt->bind_param("s", $login);
	$stmt->execute();

	$result = $stmt->get_result();

	if($result->num_rows > 0){
		returnWithError("Login already exists");
	}else{
		$stmt->close();

		// Add new user
		$stmt = $conn->prepare(
			"INSERT INTO Users (FirstName, LastName, Login, Password)
			 VALUES (?, ?, ?, ?)"
		);

		$stmt->bind_param(
			"ssss",
			$firstName,
			$lastName,
			$login,
			$hashedPassword
		);

		if ($stmt->execute()){
			$userId = $conn->insert_id;

			returnWithInfo(
				$firstName,
				$lastName,
				$userId,
			);
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
		'{"id":0,"firstName":"","lastName":"","error":"' .
		$err .
		'"}';
	sendResultInfoAsJson($retValue);
}

function returnWithInfo($firstName, $lastName, $id){
	$retValue =
		'{"id":' .
		$id .
		',"firstName":"' .
		$firstName .
		'","lastName":"' .
		$lastName .
		'","error":""}';
	sendResultInfoAsJson($retValue);
}

?>
