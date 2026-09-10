# -*- coding: utf-8 -*-
"""
네이버 블로그 포스트에서 사진을 내려받는 스크립트.

사용법:
    python tools/fetch-blog-post.py <블로그_글_주소> [저장폴더명]

예:
    python tools/fetch-blog-post.py https://blog.naver.com/hongstarhome/224380339061 case-01

- images/_raw/<저장폴더명>/ 아래에 01.jpg, 02.jpg ... 순서대로 저장합니다.
- 글 제목도 함께 출력하므로, 어떤 사례인지 확인한 뒤 시공사례로 배치하면 됩니다.
- 본문 사진만 받고, 블로그 스티커/이모티콘 등 부가 이미지는 걸러냅니다.
"""
import os
import re
import sys
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get(url, referer="https://blog.naver.com/"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": referer})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def parse_target(url):
    """블로그 주소에서 blogId 와 logNo 를 뽑아낸다."""
    q = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(q.query)
    blog_id = params.get("blogId", [None])[0]
    log_no = params.get("logNo", [None])[0]
    if not (blog_id and log_no):
        m = re.search(r"blog\.naver\.com/([^/?#]+)/(\d+)", url)
        if not m:
            raise SystemExit("블로그 글 주소를 인식하지 못했습니다: " + url)
        blog_id, log_no = m.group(1), m.group(2)
    return blog_id, log_no


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    blog_id, log_no = parse_target(sys.argv[1])
    folder = sys.argv[2] if len(sys.argv) > 2 else log_no

    view = ("https://blog.naver.com/PostView.naver?blogId=%s&logNo=%s"
            % (blog_id, log_no))
    html = get(view).decode("utf-8", "replace")

    title = re.search(r"<title>(.*?)</title>", html, re.S)
    title = re.sub(r"\s*:\s*네이버 블로그\s*$", "", title.group(1).strip()) if title else "(제목 없음)"

    # 본문 사진만 추린다 (스티커·아이콘 등 제외)
    urls, seen = [], set()
    for u in re.findall(r"https://postfiles\.pstatic\.net/[^\"'?\s\\]+", html):
        if not re.search(r"\.(jpe?g|png)$", u, re.I):
            continue
        if u in seen:
            continue
        seen.add(u)
        urls.append(u)

    out_dir = os.path.join(ROOT, "images", "_raw", folder)
    os.makedirs(out_dir, exist_ok=True)

    print("제목 : %s" % title)
    print("주소 : %s" % view)
    print("사진 : %d장  ->  %s" % (len(urls), out_dir))
    print("-" * 60)

    for i, u in enumerate(urls, 1):
        ext = ".png" if u.lower().endswith(".png") else ".jpg"
        name = "%02d%s" % (i, ext)
        path = os.path.join(out_dir, name)
        # 네이버는 정해진 크기 프리셋만 제공한다. 큰 것부터 시도해
        # 처음 성공한 것을 쓴다(파라미터 없는 주소는 썸네일이라 마지막 수단).
        data = None
        for preset in ("?type=w3840", "?type=w2000", "?type=w966", ""):
            try:
                got = get(u + preset)
            except Exception:
                continue
            if len(got) > 20000 or preset == "":
                data = got
                break
        if data is None:
            print("  %s  실패: 내려받을 수 있는 크기가 없습니다" % name)
            continue
        with open(path, "wb") as f:
            f.write(data)
        print("  %s  (%d KB)" % (name, len(data) // 1024))

    print("-" * 60)
    print("완료. 사진을 확인한 뒤 시공사례 이미지로 배치하세요.")


if __name__ == "__main__":
    main()
