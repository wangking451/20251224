#!/bin/bash
# 生产环境SSL证书部署脚本
# 使用Certbot申请Let's Encrypt免费证书

echo "🔐 生产环境SSL证书部署"
echo "======================================"

# 检查域名
read -p "请输入您的域名 (例如: example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ 域名不能为空"
    exit 1
fi

echo ""
echo "📋 将为以下域名申请证书："
echo "   - $DOMAIN"
echo "   - www.$DOMAIN"
echo ""

# 选择Web服务器
echo "请选择Web服务器："
echo "1) Caddy (推荐 - 自动续期)"
echo "2) Nginx + Certbot"
echo "3) Apache + Certbot"
read -p "请选择 (1-3): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "🚀 安装Caddy..."
        
        # 安装Caddy
        if command -v caddy &> /dev/null; then
            echo "✅ Caddy已安装"
        else
            echo "📦 正在安装Caddy..."
            
            # Debian/Ubuntu
            if command -v apt-get &> /dev/null; then
                sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
                sudo apt update
                sudo apt install caddy
            fi
            
            # CentOS/RHEL
            if command -v yum &> /dev/null; then
                yum install yum-plugin-copr
                yum copr enable @caddy/caddy
                yum install caddy
            fi
        fi
        
        echo ""
        echo "📝 配置Caddy..."
        
        # 备份原配置
        if [ -f /etc/caddy/Caddyfile ]; then
            sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup
        fi
        
        # 创建配置
        cat > /tmp/Caddyfile << EOF
$DOMAIN, www.$DOMAIN {
    reverse_proxy localhost:5174
    
    encode gzip
    
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}

api.$DOMAIN {
    reverse_proxy localhost:3001
}
EOF
        
        sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile
        
        echo "✅ 配置完成"
        echo ""
        echo "🚀 启动Caddy..."
        sudo systemctl enable caddy
        sudo systemctl restart caddy
        
        echo ""
        echo "✅ SSL证书配置完成！"
        echo "   Caddy会自动申请和续期Let's Encrypt证书"
        echo ""
        echo "🌐 访问地址："
        echo "   https://$DOMAIN"
        echo "   https://www.$DOMAIN"
        ;;
        
    2)
        echo ""
        echo "🚀 配置Nginx + Certbot..."
        
        # 安装Certbot
        if command -v certbot &> /dev/null; then
            echo "✅ Certbot已安装"
        else
            echo "📦 正在安装Certbot..."
            
            # Debian/Ubuntu
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot python3-certbot-nginx
            fi
            
            # CentOS/RHEL
            if command -v yum &> /dev/null; then
                sudo yum install -y certbot python3-certbot-nginx
            fi
        fi
        
        echo ""
        echo "📝 申请SSL证书..."
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
        
        echo ""
        echo "⏰ 设置自动续期..."
        sudo systemctl enable certbot-renew.timer
        sudo systemctl start certbot-renew.timer
        
        echo ""
        echo "✅ SSL证书配置完成！"
        echo ""
        echo "🌐 访问地址："
        echo "   https://$DOMAIN"
        echo "   https://www.$DOMAIN"
        ;;
        
    3)
        echo ""
        echo "🚀 配置Apache + Certbot..."
        
        # 安装Certbot
        if command -v certbot &> /dev/null; then
            echo "✅ Certbot已安装"
        else
            echo "📦 正在安装Certbot..."
            
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot python3-certbot-apache
            fi
            
            if command -v yum &> /dev/null; then
                sudo yum install -y certbot python3-certbot-apache
            fi
        fi
        
        echo ""
        echo "📝 申请SSL证书..."
        sudo certbot --apache -d $DOMAIN -d www.$DOMAIN
        
        echo ""
        echo "⏰ 设置自动续期..."
        sudo systemctl enable certbot-renew.timer
        sudo systemctl start certbot-renew.timer
        
        echo ""
        echo "✅ SSL证书配置完成！"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "✅ 部署完成！"
echo ""
echo "📝 证书位置："
echo "   /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "🔄 自动续期："
echo "   证书将在过期前自动续期"
echo ""
echo "🔍 验证HTTPS："
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
