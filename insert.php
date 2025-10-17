
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
  die("Connection failed: " . $conn->connect_error);
}



// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$ProductName = isset($data['ProductName']) ? $conn->real_escape_string($data['ProductName']) : '';
$SupplierID = isset($data['SupplierID']) ? $conn->real_escape_string($data['SupplierID']) : '';
$CategoryID = isset($data['CategoryID']) ? $conn->real_escape_string($data['CategoryID']) : '';
$Unit = isset($data['Unit']) ? $conn->real_escape_string($data['Unit']) : '';
$Price = isset($data['Price']) ? $conn->real_escape_string($data['Price']) : '';

// Insert without ProductID (auto-increment)
$sql = "INSERT INTO `products`(`ProductName`, `SupplierID`, `CategoryID`, `Unit`, `Price`) VALUES ('{$ProductName}', '{$SupplierID}', '{$CategoryID}', '{$Unit}', '{$Price}')";


if ($conn->query($sql) === TRUE) {
  echo json_encode(["success" => true, "message" => "Record inserted successfully"]);
} else {
  http_response_code(400);
  echo json_encode(["success" => false, "error" => $conn->error]);
}

$conn->close();
?>
