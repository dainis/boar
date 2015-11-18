import json
import os
import requests
import sys
import time
import unittest

# URL of SlimerJS / PhantomJS server
url = os.getenv('COMPATIPEDE_TAB_URL', 'http://127.0.0.1:8778')


def do_command(url, command, data={}):
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    response = requests.post('%s/%s' % (url, command),
                             data=json.dumps(data), headers=headers)
    if response.status_code == 500:
        do_command(url, "destroy")
        sys.exit(1)
    return response

class TestConsoleLogging(unittest.TestCase):

    # Note: the order matters. This API reports *accumulated* messages
    # during the session. Hence, the tests expected to be no-ops must be first

    def test_no_orientation_getter(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>void(\'foo\');</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getPluginsResults")
        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('results' in data)
        self.assertEqual(data['results']['window-orientation-usage'], False)

    def test_orientation_getter(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>void(window.orientation);</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getPluginsResults")
        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('results' in data)
        self.assertEqual(data['results']['window-orientation-usage'], True)


    @classmethod
    def tearDownClass(self):
        # Destroy Tab
        response = do_command(url, "destroy")

if __name__ == '__main__':
    unittest.main()