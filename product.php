<?php

require_once '../vendor/autoload.php';

$user = 'duan';
$pass = 'duan123456';
$url = 'http://localhost/ween/'; // or your server location. 
$node = 'node/4?_format=hal_json';


$client = new GuzzleHttp\Client([
  'base_uri' => $url
]);

$token = $client->get("rest/session/token")->getBody();

define('URL',$url);
define('USER',$user);
define('PASS',$pass);
define('TOKEN',$token);

// get 一篇文章
// $res = $client->request('GET', $node, [
//  # 'auth' => [$user, $pass]
// ]);

// $json_string = (string) $res->getBody();

// # 打印出获取到的文章数据，
// print_r(json_decode($json_string));




# 新增一篇文章，
function addOneMore($title,$data){
  global $client;

  $serialized_entity = json_encode([
    'title' => [['value' => $title]],
    'body' => [[
      'value' => $data,
      "format"=> "full_html"
    ]],
    'type' => [['target_id' => 'article']],
    '_links' => ['type' => [
        'href' => URL.'rest/type/node/article'
    ]]
  ]);

  print_r($serialized_entity);
  
  $response = $client->post('entity/node?_format=hal_json', [
      'auth' => [USER, PASS],
      'body' => $serialized_entity,
      'headers' => [
        'Content-Type' => 'application/hal+json',
        'X-CSRF-Token' => TOKEN
      ]
    ]);
    
  print_r($response);
}


$product = file_get_contents('./json/products/BYC10-600.json');
$product = json_decode($product);

addOneMore($product->title,$product->description);
addOneMore('Chemical content '.$product->title,$product->chemical_content);




?>