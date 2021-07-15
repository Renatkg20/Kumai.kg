
#Для одного сайта:

wget 
    -m -l 10 -e robots=off -p -k -E --reject-regex "wp" --no-check-certificate 
    -U="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36" 
    site-addr.com


#Для списка сайтов:
wget 
    -m -l 10 -e robots=off -p -k -E --reject-regex "wp" --no-check-certificate 
    -U="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36" 
    -i ~/Desktop/sites.txt -P ~/Desktop/sites/

#https://qna.habr.com/q/202277