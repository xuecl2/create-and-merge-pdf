# 字体文件说明

由于字体文件较大（约 16MB），已添加到 .gitignore 中。使用前请先下载中文字体。

## 下载 Noto Sans 简体中文字体

```bash
cd fonts
curl -L "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf" -o NotoSansSC.otf
```

或者使用 wget：

```bash
cd fonts
wget "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf" -O NotoSansSC.otf
```

## 替代方案

如果上述下载失败，也可以使用思源黑体：

```bash
cd fonts
curl -L "https://github.com/adobe-fonts/source-han-sans/raw/release/OTF/SimplifiedChinese/SourceHanSansSC-Regular.otf" -o SourceHanSansSC-Regular.otf
```

然后修改 `generate-receipt.js` 中的 `FONT_PATH`：

```javascript
const FONT_PATH = path.join(__dirname, 'fonts/SourceHanSansSC-Regular.otf');
```

## 系统字体

如果你的系统已安装中文字体，也可以直接使用系统字体路径。例如在 Linux 上：

```javascript
const FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc';
```

注意：TTC 格式字体可能需要额外配置。建议使用 OTF 或 TTF 格式。
