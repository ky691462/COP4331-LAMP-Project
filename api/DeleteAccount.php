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
$userId = $_SESSION["userId"];

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
		"SELECT Login, IsAdmin
		FROM Users
		WHERE ID = ?"
	);

	$stmt->bind_param(
		"i",
		$userId
	);
	$stmt->execute();
	$result = $stmt->get_result();

	if(!($row = $result->fetch_assoc())){
		returnWithError("User not found");
		$stmt->close();
		$conn->close();
		exit();
	}

	$login = $row["Login"];
	$isAdmin = $row["IsAdmin"];
	$stmt->close();

	if($login === "root"){
		returnWithError("Root account cannot be deleted");
		$conn->close();
		exit();
	}
	if($isAdmin == 1){
		$stmt = $conn->prepare(
			"SELECT COUNT(*) AS AdminCount
			FROM Users
			WHERE IsAdmin = 1
			AND ID != ?"
		);

		$stmt->bind_param(
			"i",
			$userId
		);
		$stmt->execute();
		$result = $stmt->get_result();
		$row = $result->fetch_assoc();
		$stmt->close();

		if($row["AdminCount"] == 0){
			returnWithError("Cannot delete the last Admin account");
			$conn->close();
			exit();
		}
	}

	$conn->begin_transaction();
	try{
		$stmt = $conn->prepare(
			"DELETE FROM Contacts
			WHERE UserID = ?"
		);
		$stmt->bind_param(
			"i",
			$userId
		);
		$stmt->execute();
		$stmt->close();

		$stmt = $conn->prepare(
			"DELETE FROM Users
			WHERE ID = ?"
		);
		$stmt->bind_param(
			"i",
			$userId
		);
		$stmt->execute();

		if($stmt->affected_rows == 0){
			throw new Exception("Account could not be deleted");
		}
		$stmt->close();

		$conn->commit();
		$conn->close();
		session_unset();
		session_destroy();
		returnWithError("");
		exit();
	}catch(Exception $e){
		$conn->rollback();
		$conn->close();
		returnWithError($e->getMessage());
		exit();
	}
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

?>
