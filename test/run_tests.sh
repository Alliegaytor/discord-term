#!/bin/sh

cd test/
tsc
cd ..
NODE_OPTIONS=--experimental-vm-modules jest --config=test/jest.config.ts --detectOpenHandles --runInBand --forceExit
