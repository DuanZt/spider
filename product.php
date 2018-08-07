<?php

require_once './vendor/autoload.php';

$user = 'duan';
$pass = 'duan123456';
$url = 'http://localhost/ween/'; // or your server location. 
$node = 'node/4?_format=hal_json';
$client = new GuzzleHttp\Client([
    'base_uri' => $url
]);

$token = $client->get("rest/session/token")->getBody();



$res = $client->request('GET', $node, [
 # 'auth' => [$user, $pass]
]);

$json_string = (string) $res->getBody();

# 打印出获取到的文章数据，
print_r(json_decode($json_string));


$serialized_entity = json_encode([
  'title' => [['value' => 'Example node title']],
  'type' => [['target_id' => 'article']],
  '_links' => ['type' => [
      'href' => $url.'rest/type/node/article'
  ]],
]);


# 新增一篇文章，
$response = $client->post('entity/node?_format=hal_json', [
    'auth' => [$user, $pass],
    'body' => $serialized_entity,
    'headers' => [
      'Content-Type' => 'application/hal+json',
      'X-CSRF-Token' => $token
    ],
  ]);
  
$json_string = (string) $response->getBody();

#print_r(json_decode($json_string));
?>