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

    def test_logging_empty(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>void(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 0)


    def test_logging_compile(self):
        # Compile-time and run-time errors will not be reported here
        # Open URL
        data = {'url': 'data:text/html,<html><script>void(\'foo)</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 0)


    def test_logging_runtime(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>undefined(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 0)


    def test_console_log(self):
        # Test the various console.*() methods
        # Open URL
        data = {'url': 'data:text/html,<html><script>console.log(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 1)
        self.assertEqual(data['consoleLog'][0]['msg'], 'foo')
        self.assertEqual(data['consoleLog'][0]['lineNum'], 1)


    def test_console_info(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>console.info(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 1)
        self.assertEqual(data['consoleLog'][0]['msg'], 'foo')
        self.assertEqual(data['consoleLog'][0]['lineNum'], 1)


    def test_console_warn(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>console.warn(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 1)
        self.assertEqual(data['consoleLog'][0]['msg'], 'foo')
        self.assertEqual(data['consoleLog'][0]['lineNum'], 1)


    def test_console_error(self):
        # Open URL
        data = {'url': 'data:text/html,<html><script>console.error(\'foo\')</script><p>Hello test</p></html>'}
        response = do_command(url, "open", data)

        response = do_command(url, "getConsoleLog")

        data = json.loads(response.text.encode('utf-8').strip())
        self.assertTrue('consoleLog' in data)
        self.assertEqual(len(data['consoleLog']), 1)
        self.assertEqual(data['consoleLog'][0]['msg'], 'foo')
        self.assertEqual(data['consoleLog'][0]['lineNum'], 1)

    @classmethod
    def tearDownClass(self):
        # Destroy Tab
        response = do_command(url, "destroy")

if __name__ == '__main__':
    unittest.main()