<?php

session_start();
$inData = getRequestInfo();

$login = $inData["login"];
$password = $inData["password"];

$conn = new mysqli("localhost", "LampProjectUser", "COP4331!", "LampProjectDB");

if ($conn->connect_error){
	returnWithError($conn->connect_error);
}else{
	$stmt = $conn->prepare(
		"SELECT ID, FirstName, LastName, Password, IsAdmin, IsSuspended
		 FROM Users
		 WHERE Login=?"
	);

	$stmt->bind_param("s", $login);
	$stmt->execute();

	$result = $stmt->get_result();

	if($row = $result->fetch_assoc()){
		if(password_verify($password, $row["Password"])){
			if($row["IsSuspended"] == 1){
				returnWithError("Account is suspended");
				exit();
			}
			$_SESSION["userId"] = $row["ID"];
			$_SESSION["isAdmin"] = $row["IsAdmin"];
			$_SESSION["lastActivity"] = time();
			returnWithInfo(
				$row["FirstName"],
				$row["LastName"],
				$row["ID"],
				$row["IsAdmin"]
			);
		}else{
			returnWithError("No Records Found");
		}
	}else{
		returnWithError("No Record Found");
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
		'{"id":0,"firstName":"","lastName":"","isAdmin":0,"error":"' .
		$err .
		'"}';
	sendResultInfoAsJson($retValue);
}

function returnWithInfo($firstName, $lastName, $id, $isAdmin){
	$retValue =
		'{"id":' .
		$id .
		',"firstName":"' .
		$firstName .
		'","lastName":"' .
		$lastName .
		'","isAdmin":' .
		$isAdmin .
		',"error":""}';
	sendResultInfoAsJson($retValue);
}

?>
