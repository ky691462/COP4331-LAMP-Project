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
$isSuspended = $_GET["isSuspended"] ?? "";
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
	if ($isSuspended === "0" || $isSuspended === "1"){
		$stmt = $conn->prepare(
			"SELECT ID, FirstName, LastName, Login, IsAdmin, IsSuspended
			FROM Users
			WHERE(
				FirstName LIKE ?
				OR LastName LIKE ?
				OR Login LIKE ?
			)
			AND IsSuspended = ?
			ORDER BY ID"
		);

		$stmt->bind_param(
			"sssi",
			$searchTerm,
			$searchTerm,
			$searchTerm,
			$isSuspended
		);
	}else{
		$stmt = $conn->prepare(
			"SELECT ID, FirstName, LastName, Login, IsAdmin, IsSuspended
                        FROM Users
                        WHERE FirstName LIKE ?
                        OR LastName LIKE ?
                        OR Login LIKE ?
                        ORDER BY ID"
                );

                $stmt->bind_param(
                        "sss",
                        $searchTerm,
                        $searchTerm,
                        $searchTerm
                );
	}
	$stmt->execute();
	$result = $stmt->get_result();
	$users = array();
	while($row = $result->fetch_assoc()){
		$users[] = array(
			"id" => $row["ID"],
			"firstName" => $row["FirstName"],
			"lastName" => $row["LastName"],
			"login" => $row["Login"],
			"isAdmin" => $row["IsAdmin"],
			"isSuspended" => $row["IsSuspended"]
		);
	}

	returnWithInfo($users);
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

function returnWithInfo($users){
	$retValue = array (
		"results" => $users,
		"error" => ""
	);
	sendResultInfoAsJson(json_encode($retValue));
}

?>
