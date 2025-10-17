<?php
// Handle CORS preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header("Access-Control-Allow-Origin: *");
  header("Access-Control-Allow-Methods: POST, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type, Authorization");
  header("Content-Type: application/json; charset=UTF-8");
  exit(0);
}
// ตั้งheaderเชื่อมต่อ
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
// ✅ 3. ตั้งค่าการเชื่อมต่อฐานข้อมูล
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ajbo";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$ProductID = isset($data['ProductID']) ? $conn->real_escape_string($data['ProductID']) : '';
$ProductName = isset($data['ProductName']) ? $conn->real_escape_string($data['ProductName']) : '';
$SupplierID = isset($data['SupplierID']) ? $conn->real_escape_string($data['SupplierID']) : '';
$CategoryID = isset($data['CategoryID']) ? $conn->real_escape_string($data['CategoryID']) : '';
$Unit = isset($data['Unit']) ? $conn->real_escape_string($data['Unit']) : '';
$Price = isset($data['Price']) ? $conn->real_escape_string($data['Price']) : '';

// Validate required fields
if (empty($ProductID) || empty($ProductName) || empty($SupplierID) || empty($CategoryID) || empty($Unit) || empty($Price)) {
  http_response_code(400);
  echo json_encode(["success" => false, "error" => "All fields are required"]);
  $conn->close();
  exit();
}

// SQL to update a record
$sql = "UPDATE products SET 
        ProductName = '{$ProductName}',
        SupplierID = '{$SupplierID}',
        CategoryID = '{$CategoryID}',
        Unit = '{$Unit}',
        Price = '{$Price}'
        WHERE ProductID = '{$ProductID}'";

//ตรวจสอบผลลัพธ์
if ($conn->query($sql) === TRUE) {
  echo json_encode(["success" => true, "message" => "Record updated successfully"]);
} else {
  http_response_code(400);
  echo json_encode(["success" => false, "error" => $conn->error]);
}

$conn->close();
?>
