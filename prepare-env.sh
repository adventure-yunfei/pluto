#!/bin/bash

set -e
test_val=1

function pkg_test () {
  set +e
  $1 2>/dev/null > /dev/null
  test_val=$?
  set -e
}

function pkg_install () {
  if [ $test_val != 0 ]
  then
    $1
  fi
}

echo "安装依赖..."
echo "  - pip ..."
pkg_test "pip -V"
pkg_install "pt install pip"

echo "  - mysql ..."
pkg_test "mysql --version"
pkg_install "apt install mysql-server"
pkg_test "mysql_config --version"
pkg_install "apt install libmysqlclient-dev"

echo "  - nvm & node ..."
pkg_test "node --version"
pkg_install "curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash"
pkg_install "nvm install 6"
pkg_install 'export NVM_DIR="$HOME/.nvm"'
pkg_install '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'

echo '  - nginx ...'
pkg_test 'ls /etc/nginx/'
pkg_install 'apt install nginx'

echo '  - php ...'
pkg_test 'php --version'
# Ubuntu 16 上没有php5，需要额外添加资源库
pkg_install 'add-apt-repository ppa:ondrej/php'
pkg_install 'apt install php5.6'
pkg_install 'apt install php5.6-fpm'
pkg_install 'apt install php5.6-mbstring'

echo '  - meteor ...'
pkg_test 'which meteor'
pkg_install 'curl https://install.meteor.com/ | sh'
 
echo "  - java ..."
pkg_test "java -version"
pkg_install "apt install openjdk-8-jre"

echo '  - ELK ...'
echo '    - ElasticSearch ...'
pkg_test 'ls /etc/elasticsearch/'
pkg_install 'wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -'
pkg_install 'apt-get install apt-transport-https'
pkg_install 'echo "deb https://artifacts.elastic.co/packages/5.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-5.x.list'
pkg_install 'apt-get update'
pkg_install 'apt-get install elasticsearch'
echo '    - Logstash ...'
pkg_test 'ls /etc/logstash/'
pkg_install 'apt-get install logstash'
echo '    - Kibana ...'
pkg_test 'ls /etc/kibana/'
pkg_install 'apt install kibana'
echo '    - MetricBeat'
pkg_test 'ls /etc/metricbeat'
pkg_install 'apt install metricbeat'
