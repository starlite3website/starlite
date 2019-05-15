require 'sinatra'
require 'json'
puts 'Ready to recieve data'
post '/payload' do
  push = JSON.parse(request.body.read)
  puts "I got some JSON: #{push.inspect}"
end
