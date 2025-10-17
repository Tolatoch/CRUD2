<?php

// Handle CORS preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header("Access-Control-Allow-Origin: *");
  header("Access-Control-Allow-Methods: POST, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type, Authorization");
  header("Content-Type: application/json; charset=UTF-8");
  exit(0);
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ajbo";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
  exit();
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Debug: Log received data (check XAMPP error logs)
error_log("Received data: " . print_r($data, true));

$ProductID = isset($data['ProductID']) ? $conn->real_escape_string($data['ProductID']) : '';

// Validate ProductID
if (empty($ProductID)) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "ProductID not provided or empty", "received_data" => $data]);
  $conn->close();
  exit();
}

// SQL to delete a record
$sql = "DELETE FROM products WHERE ProductID = '{$ProductID}'";

// Debug: Log SQL query
error_log("SQL Query: " . $sql);

if ($conn->query($sql) === TRUE) {
  // Check if any row was actually deleted
  if ($conn->affected_rows > 0) {
    echo json_encode(["success" => true, "message" => "Record deleted successfully"]);
  } else {
    echo json_encode(["success" => false, "message" => "No record found with ProductID: " . $ProductID]);
  }
} else {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Error deleting record: " . $conn->error]);
}

$conn->close();
?>
