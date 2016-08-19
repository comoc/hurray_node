var noble = require('noble');

const LOCAL_NAME = 'Hurray Q.board';

const SERVICE_UUID = '2737f0f6344a4bbdbfdf0372de350903';
const STATE_CHARACTERISTIC_UUID = 'ac32772b84e243e4baf0306f563e3399';
const WRITE_CHARACTERISTIC_UUID = '2cdefb1158024dff911c9b6e52e0d6c1';

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		console.log('scanning...');
		// noble.startScanning([SERVICE_UUID], false);
		noble.startScanning();
	} else {
		noble.stopScanning();
	}
});

var stateCharacteristic = null;
var writeCharacteristic = null;

noble.on('discover', function(peripheral) {
	

	console.log('found peripheral:', peripheral.advertisement);	
	// console.log('Found device with local name: ' + peripheral.advertisement.localName);
	// console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
	if (peripheral.advertisement.localName != LOCAL_NAME) {
		return;
	}
    noble.stopScanning();

	peripheral.updateRssi(function(rssi) {
		console.log("RSSI: " + rssi);
	});

	peripheral.connect(function(err) {
		peripheral.discoverServices([SERVICE_UUID], function(err, services) {
			services.forEach(function(service) {
				console.log('found service:', service.uuid);
				service.discoverCharacteristics([], function(err, characteristics) {
					characteristics.forEach(function(characteristic) {
						console.log('found characteristic:', characteristic);
						if (STATE_CHARACTERISTIC_UUID == characteristic.uuid) {
							stateCharacteristic = characteristic;
						} else if (WRITE_CHARACTERISTIC_UUID == characteristic.uuid) {
							writeCharacteristic = characteristic;
						}

						if (stateCharacteristic && writeCharacteristic) {
							startCommunication();
						}
					});
				});	
			});
		});
	});
});

function startCommunication() {
	var command = new Buffer(1);
	command.writeUInt8(0x73, 0); // 0x73 is the value of the character 's' in ASCII code.
	writeCharacteristic.write(command, false, function(err) {
		if (!err) {
			stateCharacteristic.on('data', function (data, isNotification) {
				if (data.length > 0) {
					var result = data.readUInt8(0);
            		console.log('result:', String.fromCharCode(result));
				} else {
              		console.log('result length incorrect')
            	}
            });
			stateCharacteristic.subscribe(function(err) {
				if (err) {
					console.log('subscribe error:', err);
				}
			});
		}
	});
}

